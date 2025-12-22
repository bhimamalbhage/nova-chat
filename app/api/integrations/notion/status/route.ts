import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Composio } from '@composio/core';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.COMPOSIO_API_KEY) {
            return NextResponse.json(
                { connected: false, error: 'Composio not configured' },
                { status: 200 }
            );
        }

        const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

        try {
            // Check if user has a connected Notion account
            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [user.id],
            });

            const notionAccount = connectedAccounts.items?.find((acc: any) => acc.providerId === 'NOTION' || acc.appId === 'notion');

            return NextResponse.json({
                connected: !!notionAccount,
                account: notionAccount ? {
                    id: notionAccount.id,
                    status: notionAccount.status,
                    createdAt: notionAccount.createdAt,
                } : null,
            });
        } catch (error: any) {
            console.error('[Notion Status] Error:', error);
            return NextResponse.json({
                connected: false,
                error: error.message,
            });
        }
    } catch (error) {
        console.error('[Notion Status] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
