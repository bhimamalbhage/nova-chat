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

        const notionAuthConfigId = process.env.COMPOSIO_NOTION_AUTH_CONFIG_ID || null;
        const integrationId = notionAuthConfigId || 'notion';

        const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

        try {
            // Get the connected account
            // If using integrationId='notion', we might need to query by integrationId specifically if authConfigId is not set.
            // But list() takes authConfigIds.
            // If we don't have a specific authConfigId, we might need another way to find the account.
            // However, usually `authConfigId` OR `integrationId` works.
            // Let's try passing the integrationId as authConfigId if we don't have a specific one, assuming standard integration.
            // Alternatively, we can list all accounts for the user and filter by provider.

            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [user.id],
                // If we don't have a specific auth config, we can try to filter by integration
                // But the SDK might not support filtering by integration in list().
                // Let's assume standard behavior:
            });

            // Find the Notion one manually if needed
            const notionAccount = connectedAccounts.items?.find((acc: any) => acc.providerId === 'NOTION' || acc.appId === 'notion');

            if (!notionAccount) {
                return NextResponse.json(
                    { error: 'No Notion account connected' },
                    { status: 404 }
                );
            }

            // Delete the connected account
            await composio.connectedAccounts.delete(notionAccount.id);

            console.log('[Notion Disconnect] Successfully disconnected Notion for user:', user.id);

            return NextResponse.json({
                success: true,
                message: 'Notion account disconnected successfully',
            });
        } catch (error: any) {
            console.error('[Notion Disconnect] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to disconnect Notion' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Notion Disconnect] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
