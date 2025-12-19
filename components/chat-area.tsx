'use client';

import { Conversation } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { ConversationHeader } from './conversation-header';
import { MessageInput } from './message-input';
import { cn, generateUUID } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

interface ChatAreaProps {
    chatId: string;
    isMobileView: boolean;
    onBack: () => void;
    onNewMessage?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChatArea({ chatId, isMobileView, onBack, onNewMessage }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, status, setMessages } = useChat({
        id: chatId,
        // Ensure messages have UUIDs to match database schema
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

    const { data: initialMessages } = useSWR(
        `/api/messages?chatId=${chatId}`,
        fetcher
    );

    // Populate initial messages when fetched
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

    return (
        <div className="flex flex-col h-full bg-background relative w-full">
            <ConversationHeader isMobileView={isMobileView} onBack={onBack} activeConversation={activeConversation} />

            <div className="flex-1 relative overflow-hidden">
                <ScrollArea className="h-full px-4">
                    <div className="py-4 space-y-4 max-w-3xl mx-auto">
                        {messages.map((m) => (
                            <div key={m.id} className={cn("flex flex-col w-full", m.role === 'user' ? "items-end" : "items-start")}>
                                <div className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div
                                        className={cn(
                                            "max-w-[75%] p-3 px-4 rounded-2xl text-[15px] leading-relaxed break-words whitespace-pre-wrap",
                                            m.role === 'user'
                                                ? "bg-blue-500 text-white rounded-br-none"
                                                : "bg-secondary text-secondary-foreground rounded-bl-none"
                                        )}
                                    >
                                        {m.parts.map((part, index) =>
                                            part.type === 'text' ? <span key={index}>{part.text}</span> : null
                                        )}
                                    </div>
                                </div>
                                {m.parts.some(p => p.type.startsWith('tool-')) && (
                                    <div className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg max-w-[75%]">
                                        {m.parts.filter(p => p.type.startsWith('tool-')).map((part, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <span className="font-mono">{part.type}</span>
                                                <span>{'result' in part ? '✅' : '⏳'}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </div>

            <div className="w-full bg-background/80 backdrop-blur pb-safe">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={status !== 'ready'}
                />
            </div>
        </div>
    )
}
