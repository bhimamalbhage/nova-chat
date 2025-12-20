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
            // Check if user has a connected Gmail account
            const gmailAuthConfigId = process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID || 'gmail-d7ytyb';

            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [user.id],
                authConfigIds: [gmailAuthConfigId],
            });

            const gmailAccount = connectedAccounts.items?.[0];

            return NextResponse.json({
                connected: !!gmailAccount,
                account: gmailAccount ? {
                    id: gmailAccount.id,
                    status: gmailAccount.status,
                    createdAt: gmailAccount.createdAt,
                } : null,
            });
        } catch (error: any) {
            console.error('[Gmail Status] Error:', error);
            return NextResponse.json({
                connected: false,
                error: error.message,
            });
        }
    } catch (error) {
        console.error('[Gmail Status] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
