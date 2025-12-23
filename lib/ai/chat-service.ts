import { generateText, ToolSet } from 'ai';
import { withSupermemory } from '@supermemory/tools/ai-sdk';
import { myProvider, getModelName } from '@/lib/ai/models';
import { systemPrompt } from '@/lib/ai/prompts';
import { generateUUID } from '@/lib/utils';
import { createClient } from '@supabase/supabase-js';
import {
    getChatById,
    getMessagesByChatId,
    saveChat,
    saveMessages,
    updateChatTitle
} from '@/lib/db/queries';

interface NovaChatRequest {
    userId: string;
    message: string;
    chatId: string;
    isNewChat?: boolean;
}

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : undefined;

export async function processNovaChat({ userId, message, chatId, isNewChat = false }: NovaChatRequest): Promise<string> {
    try {
        console.log(`[NovaChat] Processing for user ${userId} in chat ${chatId}`);
        const dbClient = supabaseAdmin;

        // 1. Ensure Chat Exists
        if (isNewChat) {
            await saveChat({
                id: chatId,
                userId: userId,
                title: 'Slack Conversation',
                visibility: 'private',
                client: dbClient
            });
        }

        // 2. Save User Message
        const userMsgId = generateUUID();
        await saveMessages({
            messages: [{
                id: userMsgId,
                chatId,
                role: 'user',
                parts: [{ type: 'text', text: message }],
                attachments: [],
                createdAt: new Date()
            }],
            client: dbClient
        });

        // 3. Retrieve History
        const dbMessages = await getMessagesByChatId({ id: chatId, client: dbClient });
        const coreMessages = dbMessages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || ''
        }));

        // 4. Setup Tools
        const toolsConfig: Record<string, any> = {};

        // Web Search
        if (process.env.EXA_API_KEY) {
            const { createWebSearchTool } = await import('@/lib/ai/tools/web-search');
            toolsConfig.webSearch = createWebSearchTool(process.env.EXA_API_KEY);
        }

        // Memory & Composio
        let model = myProvider;

        if (process.env.SUPERMEMORY_API_KEY) {
            const { createMemoryTools } = await import('@/lib/ai/tools/memory-tools');
            const memoryTools = createMemoryTools(process.env.SUPERMEMORY_API_KEY, userId);
            toolsConfig.searchMemories = memoryTools.searchMemories;

            model = withSupermemory(myProvider, userId, {
                conversationId: chatId,
                mode: 'full',
                verbose: true,
                addMemory: 'always',
                baseUrl: process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai',
            });
        }

        if (process.env.COMPOSIO_API_KEY) {
            const { createComposioTools } = await import('@/lib/ai/tools/composio');
            const composioTools = await createComposioTools(process.env.COMPOSIO_API_KEY, userId);
            Object.assign(toolsConfig, composioTools);
        }

        // 5. Generate Response with maxSteps
        const result = await generateText({
            model,
            system: systemPrompt({
                selectedChatModel: getModelName(),
                requestHints: { city: 'Unknown', country: 'Unknown', latitude: 0, longitude: 0 },
                isNewUser: dbMessages.length <= 1
            }),
            messages: coreMessages,
            tools: toolsConfig as ToolSet,
            experimental_maxToolRoundtrips: 5,
        } as any);

        console.log('[NovaChat] Result summary:', {
            hasText: !!result.text,
            textLength: result.text?.length || 0,
            finishReason: result.finishReason,
            toolCallsCount: result.toolCalls?.length || 0,
            stepsCount: (result as any).steps?.length || 0
        });

        let text = result.text;

        // If model ended on tool-calls without generating text, force a second pass
        if (!text && result.finishReason === 'tool-calls') {
            console.log('[NovaChat] Model ended on tool-calls, running second pass for synthesis');

            // Extract tool results from steps
            const steps = (result as any).steps || [];
            const toolResults = steps.flatMap((s: any) => s.toolResults || []);

            console.log('[NovaChat] Tool results count:', toolResults.length);

            // Build text-only messages for second pass (flattening tool results)
            const toolSummary = toolResults.map((tr: any) =>
                `Tool ${tr.toolName} result:\n${JSON.stringify(tr.output ?? tr.result, null, 2)}`
            ).join('\n\n');

            console.log('[NovaChat] Tool summary length:', toolSummary.length);

            const followUpMessages = [
                ...coreMessages,
                {
                    role: 'assistant' as 'assistant',
                    content: `Here are the tool results available to me:\n${toolSummary}\n\nBased on these results, here is the response:`
                }
            ];

            // Second pass: force the model to synthesize results
            const followUp = await generateText({
                model,
                system: systemPrompt({
                    selectedChatModel: getModelName(),
                    requestHints: { city: 'Unknown', country: 'Unknown', latitude: 0, longitude: 0 },
                    isNewUser: false
                }),
                messages: followUpMessages,
                // No tools needed for synthesis pass
            });

            text = followUp.text;
            console.log('[NovaChat] Second pass generated text:', !!text);
        }

        // Fallback
        if (!text) {
            console.log('[NovaChat] No text generated after all attempts, finishReason:', result.finishReason);
            text = "I processed your request but couldn't generate a response.";
        }

        // 6. Save Assistant Response
        if (text) {
            await saveMessages({
                messages: [{
                    id: generateUUID(),
                    chatId,
                    role: 'assistant',
                    parts: [{ type: 'text', text }],
                    attachments: [],
                    createdAt: new Date()
                }],
                client: dbClient
            });
        }

        return text;

    } catch (error) {
        console.error('[NovaChat] Error:', error);
        return "I'm having trouble connecting to my brain right now.";
    }
}
