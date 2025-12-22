import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function generateSlackResponse(userMessage: string): Promise<string> {
    try {
        const { text } = await generateText({
            model: openai('gpt-4o'),
            messages: [
                {
                    role: 'system',
                    content: 'You are Nova, a helpful AI assistant integrated with Slack. Be concise and friendly.',
                },
                {
                    role: 'user',
                    content: userMessage,
                },
            ],
        });

        return text;
    } catch (error) {
        console.error('[Slack AI] Error generating response:', error);
        return 'Sorry, I encountered an error processing your message.';
    }
}
