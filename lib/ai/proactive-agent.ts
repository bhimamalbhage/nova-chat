
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
        const shouldThrottle = await this.checkThrottle();
        if (shouldThrottle) {
            console.log('[ProactiveAgent] Throttled. Skipping message.');
            return;
        }

        // 3. Evaluate & Decide
        const decision = await this.evaluate(signals);

        if (decision.shouldMessage && decision.message) {
            console.log('[ProactiveAgent] Decision: SEND MESSAGE');
            console.log(`[ProactiveAgent] Message: "${decision.message}"`);

            // 4. Execute
            await this.execute(decision.message);
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

            // We use the tool execution API from Composio
            // Or we can use the client directly if we have the specific action wrappers
            // For now, simpler to use the raw execute logic if possible, or just skip if too complex for this file
            // We will try to get the 'GOOGLECALENDAR_LIST_EVENTS' tool and execute it.

            // NOTE: Accessing tools directly via SDK for backend execution
            try {
                const calendarTool = await this.composio.tools.get(this.userId, 'GOOGLECALENDAR_LIST_EVENTS');
                if (calendarTool && calendarTool['GOOGLECALENDAR_LIST_EVENTS']) {
                    // The SDK usage here is a bit hypothetical based on standard Composio patterns
                    // Adjusting to what I saw in composio.ts: tool.execute(...args)
                    const result = await calendarTool['GOOGLECALENDAR_LIST_EVENTS'].execute({
                        timeMin: now.toISOString(),
                        timeMax: tomorrow.toISOString(),
                        maxResults: 5,
                        singleEvents: true
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
                }
            } catch (e) {
                console.log('[ProactiveAgent] Calendar fetch failed or not connected:', e);
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

    private async evaluate(signals: Signal[]): Promise<{ shouldMessage: boolean; message?: string }> {
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
        
        Output a JSON object: { "shouldMessage": boolean, "message": string | null, "reasoning": string }
        `;

        try {
            const { object } = await generateObject({
                model: myProvider,
                schema: z.object({
                    shouldMessage: z.boolean(),
                    message: z.string().nullable(),
                    reasoning: z.string(),
                }),
                prompt: prompt,
            });

            return {
                shouldMessage: object.shouldMessage,
                message: object.message || undefined,
            };
        } catch (e) {
            console.error('[ProactiveAgent] Error evaluating:', e);
            return { shouldMessage: false };
        }
    }

    private async execute(message: string) {
        // We either Create a New Chat or Append to Latest Chat
        // Strategy: If latest chat is old (> 24h), create new. Else append.

        const recentChats = await getChatsByUserId({ id: this.userId });
        let targetChatId = recentChats[0]?.id;
        let isNewChat = false;

        if (recentChats.length > 0) {
            const latestChat = recentChats[0];
            const diffInHours = (new Date().getTime() - latestChat.createdAt.getTime()) / (1000 * 60 * 60);
            // If latest chat is older than 24h, start fresh
            if (diffInHours > 24) {
                targetChatId = generateUUID();
                isNewChat = true;
            }
        } else {
            targetChatId = generateUUID();
            isNewChat = true;
        }

        if (isNewChat) {
            await saveChat({
                id: targetChatId,
                userId: this.userId,
                title: 'Proactive Chat', // Could generate a better title
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
