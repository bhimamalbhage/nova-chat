import { Conversation } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { ConversationHeader } from './conversation-header';
import { MessageInput } from './message-input';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';

interface ChatAreaProps {
    chatId: string;
    isMobileView: boolean;
    onBack: () => void;
    onNewMessage?: () => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChatArea({ chatId, isMobileView, onBack, onNewMessage }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { data: initialMessages, error } = useSWR(
        `/api/messages?chatId=${chatId}`,
        fetcher
    );

    // Populate initial messages when fetched
    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.parts ? m.parts.map((p: any) => p.text).join('') : m.content,
                createdAt: new Date(m.createdAt),
            })));
        }
    }, [initialMessages]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Create a pseudo-Conversation object for compatibility with Header
    const activeConversation: any = {
        id: chatId,
        name: 'Chat',
        recipients: [],
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
    };

    const onSubmit = async (e?: React.FormEvent, value?: string) => {
        if (e) e.preventDefault();

        const messageContent = value || input;
        if (!messageContent.trim()) return;

        setIsLoading(true);
        setInput(''); // Clear input immediately

        try {
            const messageId = crypto.randomUUID();

            // Optimistically add user message to UI
            const userMessage: ChatMessage = {
                id: messageId,
                role: 'user',
                content: messageContent,
                createdAt: new Date(),
            };
            setMessages(prev => [...prev, userMessage]);

            // Send to API
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: chatId,
                    message: {
                        id: messageId,
                        createdAt: new Date(),
                        role: 'user',
                        content: messageContent,
                        parts: [{ type: 'text', text: messageContent }],
                    },
                    selectedChatModel: 'chat-model',
                    selectedVisibilityType: 'private',
                }),
            });

            if (!response.ok) {
                console.error('Failed to send message');
                setIsLoading(false);
                return;
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            const assistantId = crypto.randomUUID();
            let assistantContent = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('0:')) {
                            // Text delta from AI SDK stream
                            const content = line.slice(2).trim().replace(/^"|"$/g, '');
                            if (content) {
                                assistantContent += content;
                                setMessages(prev => {
                                    const withoutLastAssistant = prev.filter(m => m.id !== assistantId);
                                    return [...withoutLastAssistant, {
                                        id: assistantId,
                                        role: 'assistant' as const,
                                        content: assistantContent,
                                        createdAt: new Date(),
                                    }];
                                });
                            }
                        }
                    }
                }
            }

            if (onNewMessage && messages.length === 0) {
                onNewMessage();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background relative w-full">
            <ConversationHeader isMobileView={isMobileView} onBack={onBack} activeConversation={activeConversation} />

            <div className="flex-1 relative overflow-hidden">
                <ScrollArea className="h-full px-4">
                    <div className="py-4 space-y-4 max-w-3xl mx-auto">
                        {messages.map((m) => (
                            <div key={m.id} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[75%] p-3 px-4 rounded-2xl text-[15px] leading-relaxed break-words whitespace-pre-wrap",
                                        m.role === 'user'
                                            ? "bg-blue-500 text-white rounded-br-none"
                                            : "bg-secondary text-secondary-foreground rounded-bl-none"
                                    )}
                                >
                                    {m.content}
                                </div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </div>

            <div className="w-full bg-background/80 backdrop-blur pb-safe">
                <MessageInput
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onSendMessage={(text) => onSubmit(undefined, text)}
                    disabled={isLoading}
                />
            </div>
        </div>
    )
}
