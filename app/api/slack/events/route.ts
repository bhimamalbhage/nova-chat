import { NextRequest, NextResponse } from 'next/server';
import { verifySlackRequest } from '@/lib/slack/verify';
import { sendMessage } from '@/lib/slack/client';
import { generateSlackResponse } from '@/lib/slack/ai-handler';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-slack-signature');

        console.log('[Slack] Received event:', body.substring(0, 100));

        // 1. Verify Request (DISABLED FOR DEBUGGING)
        /*
        if (process.env.SLACK_SIGNING_SECRET) {
             const isValid = verifySlackRequest(req, body, process.env.SLACK_SIGNING_SECRET);
             if (!isValid) {
                 console.error('[Slack] Invalid signature');
                 return new NextResponse('Invalid signature', { status: 400 });
             }
        } else {
             console.warn('[Slack] SLACK_SIGNING_SECRET not set. Skipping verification.');
        }
        */

        const payload = JSON.parse(body);

        // 2. Handle URL Verification (Challenge)
        if (payload.type === 'url_verification') {
            console.log('[Slack] Handling verification challenge');
            return new NextResponse(payload.challenge, {
                status: 200,
                headers: { 'Content-Type': 'text/plain' },
            });
        }

        // 3. Handle Events (e.g. app_mention, message)
        if (payload.event) {
            console.log('[Slack] Event Type:', payload.event.type);
            console.log('[Slack] Event:', JSON.stringify(payload.event, null, 2));

            // Ignore bot messages to prevent loops
            if (payload.event.bot_id || payload.event.subtype === 'bot_message') {
                console.log('[Slack] Ignoring bot message');
                return new NextResponse('OK', { status: 200 });
            }

            // Handle DMs and mentions
            if (payload.event.type === 'message' || payload.event.type === 'app_mention') {
                const userMessage = payload.event.text;
                const channel = payload.event.channel;

                console.log('[Slack] User message:', userMessage);
                console.log('[Slack] Channel:', channel);

                // Respond with 200 OK immediately (Slack requires response within 3s)
                // Process AI response asynchronously
                setImmediate(async () => {
                    try {
                        const aiResponse = await generateSlackResponse(userMessage);
                        await sendMessage(channel, aiResponse);
                        console.log('[Slack] Sent AI response');
                    } catch (error) {
                        console.error('[Slack] Error in async handler:', error);
                    }
                });

                return new NextResponse('OK', { status: 200 });
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('[Slack] Handler error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
