import { WebClient } from '@slack/web-api';

// Token is optional here, can be passed per request
const defaultToken = process.env.SLACK_BOT_TOKEN;

export async function sendMessage(channel: string, text: string, token?: string) {
    if (!text || text.trim() === '') {
        console.warn('[Slack] Attempted to send empty message. Skipping.');
        return;
    }

    const authToken = token || defaultToken;
    if (!authToken) {
        console.error('[Slack] No token provided for sendMessage');
        return;
    }

    const client = new WebClient(authToken);

    try {
        const result = await client.chat.postMessage({
            channel,
            text,
        });
        return result.ts;
    } catch (error) {
        console.error('[Slack] Error sending message:', error);
        return undefined;
    }
}

export async function updateMessage(channel: string, text: string, ts: string, token?: string) {
    const authToken = token || defaultToken;
    if (!authToken) return;

    const client = new WebClient(authToken);

    try {
        await client.chat.update({
            channel,
            ts,
            text,
        });
    } catch (error) {
        console.error('[Slack] Error updating message:', error);
    }
}
