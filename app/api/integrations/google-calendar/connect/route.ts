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
            const connection = await composio.connectedAccounts.initiate(
                user.id,
                calendarAuthConfigId,
                {
                    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/google-calendar/callback`,
                }
            );

            return NextResponse.json({
                success: true,
                redirectUrl: connection.redirectUrl,
            });
        } catch (error: any) {
            console.error('[Google Calendar Connect] Error:', error);
            return NextResponse.json(
                { error: error.message || 'Failed to generate connection link' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Google Calendar Connect] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
