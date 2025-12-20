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
            const calendarAuthConfigId = process.env.COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID || 'google-calendar';

            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [user.id],
                authConfigIds: [calendarAuthConfigId],
            });

            const calendarAccount = connectedAccounts.items?.[0];

            return NextResponse.json({
                connected: !!calendarAccount,
                account: calendarAccount ? {
                    id: calendarAccount.id,
                    status: calendarAccount.status,
                    createdAt: calendarAccount.createdAt,
                } : null,
            });
        } catch (error: any) {
            console.error('[Google Calendar Status] Error:', error);
            return NextResponse.json({
                connected: false,
                error: error.message,
            });
        }
    } catch (error) {
        console.error('[Google Calendar Status] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
