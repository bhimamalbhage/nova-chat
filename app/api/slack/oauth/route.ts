import { NextRequest, NextResponse } from 'next/server';
import { WebClient } from '@slack/web-api';
import { saveSlackInstallation } from '@/lib/db/slack-installations';

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Contains userId potentially
    const error = searchParams.get('error');

    if (error) {
        return new NextResponse(`Slack OAuth Error: ${error}`, { status: 400 });
    }

    if (!code) {
        return new NextResponse('Missing code', { status: 400 });
    }

    try {
        const clientId = process.env.SLACK_CLIENT_ID;
        const clientSecret = process.env.SLACK_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error('Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET');
            return new NextResponse('Server configuration error', { status: 500 });
        }

        const client = new WebClient();
        const response = await client.oauth.v2.access({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            // redirect_uri: we can omit if exact match in dashboard, or strictly match request
            // redirect_uri: `${process.env.APP_URL}/api/slack/oauth`
        });

        if (!response.ok || !response.access_token || !response.team) {
            console.error('Slack OAuth Failed:', response);
            return new NextResponse('Failed to exchange token', { status: 500 });
        }

        // Save Installation
        await saveSlackInstallation({
            team_id: response.team.id!,
            team_name: response.team.name!,
            access_token: response.access_token,
            bot_user_id: response.bot_user_id!,
            installer_user_id: state || undefined // If state held userId
        });

        // Redirect to success page
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(new URL('/integrations?slack=success', baseUrl));

    } catch (error) {
        console.error('OAuth Handler Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
