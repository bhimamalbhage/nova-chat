

import {
    streamText,
    stepCountIs,
    type UIMessage,
    type ToolSet,
} from 'ai';
import { withSupermemory } from '@supermemory/tools/ai-sdk';

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

        const { id, message: legacyMessage, messages, selectedChatModel, selectedVisibilityType } = requestBody;

        let message = legacyMessage;
        if (!message && messages && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];

            const parts =
                Array.isArray(lastMessage.parts) && lastMessage.parts.length > 0
                    ? lastMessage.parts
                    : [{ type: 'text', text: '' }];

            const contentString = parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('');


            message = {
                id: lastMessage.id || generateUUID(),
                createdAt: lastMessage.createdAt
                    ? new Date(lastMessage.createdAt)
                    : new Date(),
                role: 'user',
                content: contentString,
                parts,
            };

        }

        if (!message) {
            return new Response('Missing message', { status: 400 });
        }

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
            content: '',
            parts: (dbMsg.parts && dbMsg.parts.length > 0) ? dbMsg.parts : [{ type: 'text', text: dbMsg.content || '' }],
            createdAt: dbMsg.createdAt,
        })) as UIMessage[];

        const currentMessageContent = message.content ? String(message.content) : "";

        // Ensure parts are populated if validation failed on client or transport
        // This MUST happen before saving to ensure parts is never empty in DB
        let userMessageParts = message.parts;
        if (!userMessageParts || userMessageParts.length === 0) {
            if (currentMessageContent) {
                userMessageParts = [{ type: 'text', text: currentMessageContent }];
            } else {
                // Fallback: if no content at all, create empty text part
                userMessageParts = [{ type: 'text', text: '' }];
            }
        }

        // Save user message with guaranteed non-empty parts
        await saveMessages({
            messages: [
                {
                    id: message.id,
                    chatId: id,
                    role: 'user',
                    parts: userMessageParts,
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
        const startMessages = [
            ...formattedPreviousMessages.map(m => ({
                role: m.role,
                content: m.parts
                    ?.filter(p => p.type === 'text')
                    .map(p => p.text)
                    .join('') || ''
            })),
            {
                role: 'user' as const,
                content: currentMessageContent
            }
        ]

        // Initialize tools object
        const toolsConfig: Record<string, any> = {};

        // Add web search tool if available
        if (process.env.EXA_API_KEY) {
            const { createWebSearchTool } = await import('@/lib/ai/tools/web-search');
            toolsConfig.webSearch = createWebSearchTool(process.env.EXA_API_KEY);
        }

        // Prepare model with Supermemory wrapper
        let model = myProvider;

        if (process.env.SUPERMEMORY_API_KEY) {
            const { createMemoryTools } = await import('@/lib/ai/tools/memory-tools');
            const memoryTools = createMemoryTools(process.env.SUPERMEMORY_API_KEY, user.id);

            // Add searchMemories tool (addMemory is handled by withSupermemory)
            toolsConfig.searchMemories = memoryTools.searchMemories;

            // Wrap the model with Supermemory for automatic memory retrieval and saving
            model = withSupermemory(myProvider, user.id, {
                conversationId: id,
                mode: 'full',
                verbose: true,
                addMemory: 'always',
                baseUrl: process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai',
            });
        }

        console.log('Final tools:', Object.keys(toolsConfig));

        const result = streamText({
            model,
            system: systemPrompt({ selectedChatModel: getModelName(), requestHints, isNewUser: previousMessages.length === 0 }),
            messages: startMessages as any,
            tools: toolsConfig as ToolSet,
            stopWhen: stepCountIs(5), // Allow multi-step tool calls
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

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
