import { processNovaChat } from '@/lib/ai/chat-service';
import { generateUUID } from '@/lib/utils';
import { getNovaUserBySlackId } from '@/lib/db/slack';
import { generateLinkToken } from '@/lib/slack/link';

// Map Slack Channels to Persistent Chat IDs (In-memory for dev)
const CHANNEL_CHAT_MAPPING: Record<string, string> = {};

export async function generateSlackResponse(userMessage: string, slackUserId: string, channelId: string): Promise<string> {
    try {
        // 1. Resolve User
        let novaUserId = await getNovaUserBySlackId(slackUserId);

        // Fallback or Trigger Linking
        if (!novaUserId) {
            // Check manual override
            if (process.env.TEST_NOVA_USER_ID) {
                novaUserId = process.env.TEST_NOVA_USER_ID;
            } else {
                // Generate Link
                const token = generateLinkToken(slackUserId);
                // Use APP_URL if set, else assume localhost
                const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                const link = `${baseUrl}/slack/link?token=${token}`;

                return `I don't recognize you yet! To enable personalized features, please link your account: \n${link}`;
            }
        }

        // 2. Resolve Chat ID
        let chatId = CHANNEL_CHAT_MAPPING[channelId];
        let isNewChat = false;

        if (!chatId) {
            chatId = generateUUID();
            CHANNEL_CHAT_MAPPING[channelId] = chatId;
            isNewChat = true;
        }

        // 3. Process
        const response = await processNovaChat({
            userId: novaUserId!,
            message: userMessage,
            chatId,
            isNewChat
        });

        return response;

    } catch (error) {
        console.error('[Slack AI] Error:', error);
        return 'Sorry, I got confused processing your request.';
    }
}
