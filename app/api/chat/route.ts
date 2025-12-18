

import {
    streamText,
    convertToModelMessages,
    type UIMessage,
} from 'ai';

import { createClient } from '@/utils/supabase/server';
import {
    getChatById,
    getMessageCountByUserId,
    getMessagesByChatId,
    saveChat,
    saveMessages,
    createStreamId,
} from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { postRequestBodySchema } from './schema';
import { systemPrompt } from '@/lib/ai/prompts';
import { myProvider, getModelName } from '@/lib/ai/models';

export const maxDuration = 60;

export async function POST(request: Request) {
    try {
        const json = await request.json();
        const requestBody = postRequestBodySchema.parse(json);

        const { id, message, selectedChatModel, selectedVisibilityType } = requestBody;

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return new Response('Unauthorized', { status: 401 });
        }

        // Parallelize DB checks to improve performance
        const [messageCount, chat, previousMessages] = await Promise.all([
            getMessageCountByUserId({ id: user.id, differenceInHours: 24 }),
            getChatById({ id }),
            getMessagesByChatId({ id })
        ]);

        if (messageCount > 500) { // arbitrary limit
            return new Response('Rate limit exceeded', { status: 429 });
        }

        if (!chat) {
            await saveChat({
                id,
                userId: user.id,
                title: 'New Chat', // Logic to generate title could be added later
                visibility: selectedVisibilityType,
            });
        } else {
            if (chat.userId !== user.id) {
                return new Response('Forbidden', { status: 403 });
            }
        }

        // Convert to AI SDK messages
        const formattedPreviousMessages = previousMessages.map((dbMsg) => ({
            id: dbMsg.id,
            role: dbMsg.role as UIMessage['role'],
            parts: dbMsg.parts as any, // Cast parts to any or specific type if needed
            createdAt: dbMsg.createdAt,
        })) as UIMessage[];

        const currentMessageContent = String(message.content); // Ensure content is string

        // Save user message
        await saveMessages({
            messages: [
                {
                    id: message.id,
                    chatId: id,
                    role: 'user',
                    parts: message.parts,
                    attachments: [],
                    createdAt: new Date(),
                },
            ],
        });

        // We can use geolocation if available, but optional
        const requestHints = {
            latitude: 0,
            longitude: 0,
            city: 'Unknown',
            country: 'Unknown',
        };

        // Prepare messages for the AI model
        const startMessages = [...formattedPreviousMessages, {
            id: message.id,
            role: 'user' as const,
            parts: message.parts, // Use parts directly
            createdAt: new Date()
        }] as UIMessage[];

        // We are skipping the internal supermemory tools for now as they require a backend service.
        // If needed, we can add standard tools (like web search) here later.



        const result = streamText({
            model: myProvider,
            system: systemPrompt({ selectedChatModel: getModelName(), requestHints, isNewUser: previousMessages.length === 0 }),
            messages: convertToModelMessages(startMessages),
            onFinish: async ({ text }) => {
                if (!text) return;

                // Save assistant message
                await saveMessages({
                    messages: [
                        {
                            id: generateUUID(),
                            chatId: id,
                            role: 'assistant',
                            parts: [{ type: 'text', text }],
                            attachments: [],
                            createdAt: new Date(),
                        },
                    ],
                });
            },
        });

        return result.toTextStreamResponse();

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
