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

        // Get the Notion auth config ID from environment or use default
        // If undefined, we can try using "notion" as the entityId directly which maps to the default integration
        const notionAuthConfigId = process.env.COMPOSIO_NOTION_AUTH_CONFIG_ID || null;
        const integrationId = notionAuthConfigId || 'notion';

        const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

        try {
            // Generate a connection link for the user to authorize Notion
            const connection = await composio.connectedAccounts.initiate(
                user.id,
                integrationId,
                {
                    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/notion/callback`,
                    allowMultiple: true
                } as any
            );

            return NextResponse.json({
                success: true,
                redirectUrl: connection.redirectUrl,
            });
        } catch (error: any) {
            console.error('[Notion Connect] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to generate connection link' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Notion Connect] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
