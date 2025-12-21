'use client';

import { Conversation } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { ConversationHeader } from './conversation-header';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { LoadingSkeleton } from './loading-skeleton';
import { cn, generateUUID } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Check, CheckCheck, Clock } from 'lucide-react';

interface ChatAreaProps {
    chatId: string;
    isMobileView: boolean;
    onBack: () => void;
    onNewMessage?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChatArea({ chatId, isMobileView, onBack, onNewMessage }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTimestamps, setShowTimestamps] = useState(false);

    const { messages, sendMessage, status, setMessages } = useChat({
        id: chatId,
        generateId: generateUUID,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: {
                id: chatId,
                selectedChatModel: 'chat-model',
                selectedVisibilityType: 'private',
            },
        }),
        onFinish: () => {
            if (onNewMessage && messages.length === 0) {
                onNewMessage();
            }
        },
    });

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;
        sendMessage({ text });
    };

    const { data: initialMessages, isLoading: isLoadingMessages } = useSWR(
        `/api/messages?chatId=${chatId}`,
        fetcher
    );

    // Populate initial messages when fetched
    useEffect(() => {
        if (initialMessages && messages.length === 0) {
            setMessages(initialMessages.map((m: any) => ({
                id: m.id,
                role: m.role,
                parts: m.parts || [{ type: 'text', text: m.content || '' }],
                createdAt: new Date(m.createdAt),
            })));
        }
    }, [initialMessages, setMessages, messages.length]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, status]);

    // Create a pseudo-Conversation object for compatibility with Header
    const activeConversation: any = {
        id: chatId,
        name: 'Chat',
        recipients: [],
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0
    };

    const getMessageStatus = (message: any) => {
        if (message.role !== 'user') return null;

        // Simple status logic - in production, this would come from the message metadata
        return 'sent'; // Could be 'sending', 'sent', 'error'
    };

    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    return (
        <div className="flex flex-col h-full bg-transparent relative w-full">
            <ConversationHeader
                isMobileView={isMobileView}
                onBack={onBack}
                activeConversation={activeConversation}
            />

            <div className="flex-1 relative overflow-hidden">
                {isLoadingMessages ? (
                    <LoadingSkeleton type="message" count={4} />
                ) : (
                    <ScrollArea className="h-full px-4">
                        <div className="py-6 space-y-8 max-w-3xl mx-auto">
                            {messages.map((m, index) => {
                                const messageStatus = getMessageStatus(m);
                                const messageDate = (m as any).createdAt;
                                const showTime = showTimestamps && messageDate;

                                return (
                                    <div
                                        key={m.id}
                                        className={cn(
                                            "flex flex-col w-full animate-message-in opacity-0",
                                            m.role === 'user' ? "items-end" : "items-start"
                                        )}
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <div className={cn("flex w-full items-end gap-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                                            <div
                                                className={cn(
                                                    "max-w-[85%] p-4 px-6 text-[15px] leading-relaxed break-words shadow-lg transition-all duration-300 hover:shadow-xl group",
                                                    m.role === 'user'
                                                        ? "bg-gradient-to-br from-primary to-blue-600 text-white rounded-[24px] rounded-br-sm border border-white/10"
                                                        : "glass text-foreground rounded-[24px] rounded-bl-sm"
                                                )}
                                            >
                                                {m.parts.map((part, index) =>
                                                    part.type === 'text' ? (
                                                        <span key={index} className="whitespace-pre-wrap font-medium">
                                                            {part.text}
                                                        </span>
                                                    ) : null
                                                )}

                                                {/* Message metadata */}
                                                {showTime && (
                                                    <div className={cn(
                                                        "text-[10px] mt-2 flex items-center gap-1 opacity-70",
                                                        m.role === 'user' ? "text-white/80" : "text-muted-foreground"
                                                    )}>
                                                        {formatTimestamp(messageDate)}
                                                        {messageStatus && m.role === 'user' && (
                                                            <>
                                                                <span>•</span>
                                                                <CheckCheck className="w-3 h-3" />
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Tool usage indicator */}
                                        {m.parts.some(p => p.type.startsWith('tool-')) && (
                                            <div className="mt-2 text-xs text-muted-foreground glass border border-white/5 p-2 px-3 rounded-lg max-w-[80%] ml-1 inline-flex items-center gap-2">
                                                {m.parts.filter(p => p.type.startsWith('tool-')).map((part, index) => (
                                                    <div key={index} className="flex gap-2 items-center">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                        <span className="font-mono text-[10px] uppercase tracking-wider text-primary/80">
                                                            {part.type.replace('tool-', '')}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Typing indicator */}
                            {status === 'streaming' && (
                                <div className="flex justify-start animate-in fade-in duration-300">
                                    <TypingIndicator />
                                </div>
                            )}

                            <div ref={scrollRef} className="h-4" />
                        </div>
                    </ScrollArea>
                )}
            </div>

            <div className="w-full bg-background/0 backdrop-blur-none pb-safe z-10">
                <div className="max-w-3xl mx-auto">
                    <MessageInput
                        onSendMessage={handleSendMessage}
                        disabled={status === 'streaming' || status === 'submitted'}
                    />
                </div>
            </div>
        </div>
    )
}
