import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/lib/slack/client';
import { generateSlackResponse } from '@/lib/slack/ai-handler';
import { verifySlackRequest } from '@/lib/slack/verify';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();

        // Verification logic
        const secret = process.env.SLACK_SIGNING_SECRET;
        if (secret && !verifySlackRequest(req, body, secret)) {
            console.error('[Slack] Invalid signature');
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const payload = JSON.parse(body);

        if (payload.type === 'url_verification') {
            return new NextResponse(payload.challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
        }

        if (payload.event) {
            // Ignore bot messages
            if (payload.event.bot_id || payload.event.subtype === 'bot_message') {
                return new NextResponse('OK', { status: 200 });
            }

            const eventType = payload.event.type;
            const channelType = payload.event.channel_type;

            // Handle App Mentions and DMs
            if (eventType === 'app_mention' || (eventType === 'message' && channelType === 'im')) {
                const userMessage = payload.event.text;
                const channel = payload.event.channel;
                const user = payload.event.user; // Slack User ID
                const teamId = payload.team_id; // Slack Team ID

                console.log(`[Slack] Processing ${eventType} (${channelType}) from ${user} in ${channel}`);

                // Define the background task
                const handleAsync = async () => {
                    try {
                        // Resolve Token
                        const { getSlackAccessToken } = await import('@/lib/db/slack-installations');
                        const token = await getSlackAccessToken(teamId);

                        // Send "Thinking..." indicator
                        const { updateMessage } = await import('@/lib/slack/client');
                        const thinkingTs = await sendMessage(channel, "Let me think...", token || undefined);

                        if (!thinkingTs) {
                            const aiResponse = await generateSlackResponse(userMessage, user, channel);
                            await sendMessage(channel, aiResponse, token || undefined);
                            return;
                        }

                        try {
                            const aiResponse = await generateSlackResponse(userMessage, user, channel);
                            await updateMessage(channel, aiResponse, thinkingTs, token || undefined);
                        } catch (err: any) {
                            console.error('[Slack] Error generating response:', err);
                            await updateMessage(channel, "I had a hiccup processing that request.", thinkingTs, token || undefined);
                        }
                    } catch (error) {
                        console.error('[Slack] Error in async handler:', error);
                        await sendMessage(channel, "I had a hiccup processing that.");
                    }
                };

                // Use waitUntil if available (Vercel/Next.js requirement for background tasks)
                if ((req as any).waitUntil) {
                    (req as any).waitUntil(handleAsync());
                } else {
                    // Fallback for local dev
                    handleAsync();
                }

                return new NextResponse('OK', { status: 200 });
            }
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('[Slack] Handler error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
