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

        const calendarAuthConfigId = process.env.COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID || 'google-calendar';
        const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

        try {
            const connectedAccounts = await composio.connectedAccounts.list({
                userIds: [user.id],
                authConfigIds: [calendarAuthConfigId],
            });

            const calendarAccount = connectedAccounts.items?.[0];

            if (!calendarAccount) {
                return NextResponse.json(
                    { error: 'No Google Calendar account connected' },
                    { status: 404 }
                );
            }

            await composio.connectedAccounts.delete(calendarAccount.id);

            console.log('[Google Calendar Disconnect] Successfully disconnected Google Calendar for user:', user.id);

            return NextResponse.json({
                success: true,
                message: 'Google Calendar account disconnected successfully',
            });
        } catch (error: any) {
            console.error('[Google Calendar Disconnect] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to disconnect Google Calendar' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Google Calendar Disconnect] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
