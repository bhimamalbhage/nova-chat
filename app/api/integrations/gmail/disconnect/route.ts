import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Composio } from '@composio/core';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.COMPOSIO_API_KEY) {
            return NextResponse.json(
                { error: 'Composio not configured' },
                { status: 500 }
            );
        }

        const gmailAuthConfigId = process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID || 'gmail-d7ytyb';
        const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

        try {
            // Get the connected account
            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [user.id],
                authConfigIds: [gmailAuthConfigId],
            });

            const gmailAccount = connectedAccounts.items?.[0];

            if (!gmailAccount) {
                return NextResponse.json(
                    { error: 'No Gmail account connected' },
                    { status: 404 }
                );
            }

            // Delete the connected account
            await composio.connectedAccounts.delete(gmailAccount.id);

            console.log('[Gmail Disconnect] Successfully disconnected Gmail for user:', user.id);

            return NextResponse.json({
                success: true,
                message: 'Gmail account disconnected successfully',
            });
        } catch (error: any) {
            console.error('[Gmail Disconnect] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to disconnect Gmail' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Gmail Disconnect] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
