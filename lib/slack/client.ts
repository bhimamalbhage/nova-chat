import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_BOT_TOKEN;

if (!token) {
    console.warn('[Slack] SLACK_BOT_TOKEN not set. Slack client will not work.');
}

export const slackClient = new WebClient(token);

export async function sendMessage(channel: string, text: string) {
    try {
        await slackClient.chat.postMessage({
            channel,
            text,
        });
    } catch (error) {
        console.error('[Slack] Error sending message:', error);
        throw error;
    }
}
