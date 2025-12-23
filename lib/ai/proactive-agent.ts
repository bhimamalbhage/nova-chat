
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { myProvider } from '@/lib/ai/models';
import { createClient } from '@/utils/supabase/server';
import { generateUUID } from '@/lib/utils';
import { saveMessages, saveChat, getChatsByUserId, getMessagesByChatId } from '@/lib/db/queries';

interface Signal {
    type: 'calendar' | 'email' | 'memory' | 'routine';
    content: string;
    importance: number;
    sourceStr: string;
}

export class ProactiveAgent {
    private userId: string;
    private composio: any; // Using any to bypass strict provider typing issues for now

    constructor(userId: string) {
        this.userId = userId;
        this.composio = new Composio({
            apiKey: process.env.COMPOSIO_API_KEY!,
            provider: new VercelProvider(),
        });
    }

    static async run(userId: string) {
        const agent = new ProactiveAgent(userId);
        await agent.process();
    }

    async process() {
        console.log(`[ProactiveAgent] Starting check for user ${this.userId}`);

        // 1. Gather Signals
        const signals = await this.gatherSignals();
        if (signals.length === 0) {
            console.log('[ProactiveAgent] No signals found, skipping.');
            return;
        }

        // 2. Throttling Check
        // const shouldThrottle = await this.checkThrottle();
        // if (shouldThrottle) {
        //     console.log('[ProactiveAgent] Throttled. Skipping message.');
        //     return;
        // }

        // 3. Evaluate & Decide
        const decision = await this.evaluate(signals);

        if (decision.shouldMessage && decision.message) {
            console.log('[ProactiveAgent] Decision: SEND MESSAGE');
            console.log(`[ProactiveAgent] Message: "${decision.message}"`);

            // 4. Execute
            await this.execute(decision);
        } else {
            console.log('[ProactiveAgent] Decision: NO MESSAGE');
        }
    }

    private async gatherSignals(): Promise<Signal[]> {
        const signals: Signal[] = [];

        try {
            // --- Calendar Signals ---
            // Try to find if user has connected calendar
            // Finding integration status is tricky without direct DB access to integrations table
            // We'll try to fetch and catch error

            // Fetch events for next 24 hours
            const now = new Date();
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            try {
                const { createComposioTools } = await import('@/lib/ai/tools/composio');
                const tools = await createComposioTools(process.env.COMPOSIO_API_KEY!, this.userId) as any;

                if (tools && tools.GOOGLECALENDAR_EVENTS_LIST) {
                    const result = await tools.GOOGLECALENDAR_EVENTS_LIST.execute({
                        timeMin: now.toISOString(),
                        timeMax: tomorrow.toISOString(),
                        maxResults: 5,
                        singleEvents: true
                    });

                    // Handle Composio's nested data structure (result.data.items OR result.items)
                    const items = result.items || (result.data && result.data.items) || [];

                    if (Array.isArray(items)) {
                        items.forEach((item: any) => {
                            signals.push({
                                type: 'calendar',
                                content: `Event: ${item.summary} at ${item.start.dateTime || item.start.date}`,
                                importance: 0.8,
                                sourceStr: 'Google Calendar'
                            });
                        });
                    }
                } else if (tools && tools.GOOGLECALENDAR_FIND_EVENT) {
                    // Fallback to FIND_EVENT if LIST is not available
                    console.log('[ProactiveAgent] LIST_EVENTS not found, trying FIND_EVENT...');
                    const result = await tools.GOOGLECALENDAR_FIND_EVENT.execute({
                        query: "meeting", // Generic query to try and catch something
                        timeMin: now.toISOString(),
                        timeMax: tomorrow.toISOString()
                    });
                    if (result && result.items && Array.isArray(result.items)) {
                        result.items.forEach((item: any) => {
                            signals.push({
                                type: 'calendar',
                                content: `Event: ${item.summary} at ${item.start.dateTime || item.start.date}`,
                                importance: 0.8,
                                sourceStr: 'Google Calendar'
                            });
                        });
                    }
                } else {
                    console.log('[ProactiveAgent] GOOGLECALENDAR_EVENTS_LIST tool not found in available tools.');
                }


            } catch (e) {
                console.log('[ProactiveAgent] Calendar fetch failed:', e);
            }

            // --- Memory Signals (Supermemory) ---
            // Fetch high importance memories or memories related to "goals", "deadlines"
            // Simulating this part since we don't have direct access to `searchMemories` without context
            // In a real implementation, we would call the Supermemory search API here.

            // signals.push({ type: 'memory', content: 'User memory...', ... })

        } catch (error) {
            console.error('[ProactiveAgent] Error gathering signals:', error);
        }

        return signals;
    }

    private async checkThrottle(): Promise<boolean> {
        // Simple logic: Don't send if we sent a proactive message in last 12 hours
        // We need to check the DB for the last message from 'assistant' that matches a proactive pattern
        // Or store a flag. For now, check last 10 messages of the most recent chat.

        const recentChats = await getChatsByUserId({ id: this.userId });
        if (recentChats.length === 0) return false;

        const latestChat = recentChats[0];
        const messages = await getMessagesByChatId({ id: latestChat.id });

        if (messages.length === 0) return false;

        const lastMessage = messages[messages.length - 1];

        // If last message was from assistant and was sent < 12 hours ago
        if (lastMessage.role === 'assistant') {
            const diffInHours = (new Date().getTime() - lastMessage.createdAt.getTime()) / (1000 * 60 * 60);
            if (diffInHours < 12) {
                // This is a naive throttle (stops if *any* assistant message was recent)
                // Better would be to check if the last message was *proactive* specifically
                // But this prevents spamming the user even in active conversation
                // Actually, if they are active, we might NOT want to interrupt with a NEW topic unless urgent.
                return true;
            }
        }

        return false;
    }

    private async evaluate(signals: Signal[]): Promise<{ shouldMessage: boolean; message?: string; title?: string }> {
        // "Think" Step

        const signalContext = signals.map(s => `- [${s.type.toUpperCase()}] ${s.content}`).join('\n');

        const prompt = `
        You are a Proactive Agent. Your goal is to decide if you should initiate a conversation with the user based on these signals.
        
        SIGNALS:
        ${signalContext}
        
        RULES:
        1. Only message if there is high value (e.g., upcoming event, important reminder).
        2. Do NOT be annoying. If signals are trivial, do not message.
        3. If you decide to message, write a "Soft Opener".
           - Casual, friendly, and conversational.
           - Ask a question or offer help.
           - Do NOT sound like a notification bot.
           - Keep it short (1-2 sentences).
        
        Output a JSON object: { 
            "shouldMessage": boolean, 
            "message": string | null, 
            "reasoning": string,
            "title": string | null   // Short title if taking action (e.g. "Calendar Briefing", "Standup Prep")
        }
        `;

        try {
            const { object } = await generateObject({
                model: myProvider,
                schema: z.object({
                    shouldMessage: z.boolean(),
                    message: z.string().nullable(),
                    reasoning: z.string(),
                    title: z.string().nullable().optional(),
                }),
                prompt: prompt,
            });

            return {
                shouldMessage: object.shouldMessage,
                message: object.message || undefined,
                title: object.title || undefined,
            };
        } catch (e) {
            console.error('[ProactiveAgent] Error evaluating:', e);
            return { shouldMessage: false };
        }
    }

    private async execute(decision: { message?: string; title?: string }) {
        const message = decision.message;
        if (!message) return;

        console.log('[ProactiveAgent] Message:', JSON.stringify(message));
        // We either Create a New Chat or Append to Latest Chat
        // Strategy: If latest chat is old (> 24h), create new. Else append.

        // Strategy: For Proactive messages, we generally want to start a NEW chat
        // so it appears as a fresh notification/thread and doesn't get buried in an old context.
        // UNLESS the user was explicitly talking about this topic just now (which is hard to know).
        // Simpler approach for "Proactive" feel: Always start fresh.

        const recentChats = await getChatsByUserId({ id: this.userId });
        let targetChatId = generateUUID();
        let isNewChat = true;

        // Optional: If we wanted to thread it, we'd check recentChats[0] here.
        // But per feedback, we force new chat.

        if (isNewChat) {
            await saveChat({
                id: targetChatId,
                userId: this.userId,
                title: `⚡️ ${decision.title || 'Proactive Chat'}`,
                visibility: 'private',
            });
        }

        await saveMessages({
            messages: [{
                id: generateUUID(),
                chatId: targetChatId,
                role: 'assistant',
                parts: [{ type: 'text', text: message }],
                attachments: [],
                createdAt: new Date(),
            }]
        });

        console.log(`[ProactiveAgent] Message saved to chat ${targetChatId}`);
    }
}
