

import {
    streamText,
    stepCountIs,
    type UIMessage,
    type ToolSet,
    generateText,
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
    updateChatTitle,
    deleteChatById, // Added import
} from '@/lib/db/queries';

// ... (existing code)

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return new Response('Missing id', { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const chat = await getChatById({ id });

        if (!chat) {
            return new Response('Chat not found', { status: 404 });
        }

        if (chat.userId !== user.id) {
            return new Response('Forbidden', { status: 403 });
        }

        await deleteChatById({ id });

        return new Response('Chat deleted', { status: 200 });
    } catch (error) {
        console.error('Delete Chat Error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}

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
                    : [{ type: 'text', text: lastMessage.content || '' }];

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

        // Add Composio tools if available
        if (process.env.COMPOSIO_API_KEY) {
            const { createComposioTools } = await import('@/lib/ai/tools/composio');
            // Use user.id as the external user identifier for Composio
            const composioTools = await createComposioTools(process.env.COMPOSIO_API_KEY, user.id);

            // composioTools is already in the format expected by Vercel AI SDK
            Object.assign(toolsConfig, composioTools);
        }

        console.log('Final tools:', Object.keys(toolsConfig));

        const result = streamText({
            model,
            system: systemPrompt({ selectedChatModel: getModelName(), requestHints, isNewUser: previousMessages.length === 0 }),
            messages: startMessages as any,
            tools: toolsConfig as ToolSet,
            stopWhen: stepCountIs(5), // Allow multi-step tool calls
            onStepFinish: async ({ toolCalls, toolResults }) => {
                if (toolCalls && toolCalls.length > 0) {
                    console.log(`[AI Step] Executed ${toolCalls.length} tools`);
                    toolCalls.forEach(tc => {
                        console.log(`[AI Step] Tool Call: ${tc.toolName}`);
                        console.log(`[AI Step] Params:`, JSON.stringify((tc as any).args, null, 2));
                    });
                }
            },
            onFinish: async ({ text }) => {
                const responseText = text || '';
                console.log(`[onFinish] Text length: ${responseText.length}`);

                // Save assistant message only if there is text
                if (responseText) {
                    try {
                        await saveMessages({
                            messages: [
                                {
                                    id: generateUUID(),
                                    chatId: id,
                                    role: 'assistant',
                                    parts: [{ type: 'text', text: responseText }],
                                    attachments: [],
                                    createdAt: new Date(),
                                },
                            ],
                        });
                    } catch (error) {
                        console.error('[onFinish] Error saving assistant message:', error);
                    }
                }

                console.log(`[onFinish] Previous messages count: ${previousMessages.length}`);

                // Generate title for new chats
                if (previousMessages.length === 0) {
                    console.log('[onFinish] Generating title for new chat...');
                    try {
                        const titleSystemPrompt = 'You are a helpful assistant. Generate a short, concise, and descriptive title (max 5 words) for the following chat conversation. Do not use quotes or special characters. strictly return the title only.';
                        // Fallback to user message if assistant response is empty
                        const titleUserPrompt = responseText
                            ? `User: ${currentMessageContent}\nAssistant: ${responseText}`
                            : `Generate a title for this user query: ${currentMessageContent}`;

                        const { text: title } = await generateText({
                            model: myProvider,
                            system: titleSystemPrompt,
                            prompt: titleUserPrompt,
                        });

                        console.log(`[onFinish] Generated title: "${title}"`);

                        if (title) {
                            await updateChatTitle({ id, title: title.trim() });
                            console.log('[onFinish] Title updated in DB');
                        }
                    } catch (error) {
                        console.error('Error generating chat title:', error);
                    }
                }
            },
        });

        return result.toUIMessageStreamResponse();

    } catch (error) {
        console.error('Chat API Error:', error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
    }
}
