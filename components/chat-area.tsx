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
import { CheckCheck, Sparkles } from 'lucide-react';
import { TurnManager } from '@/lib/utils/turn-manager';
import { AnimatePresence, motion } from 'framer-motion';

interface ChatAreaProps {
    chatId: string;
    isMobileView: boolean;
    onBack: () => void;
    onNewMessage?: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function ChatArea({ chatId, isMobileView, onBack, onNewMessage }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showTimestamps, setShowTimestamps] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Initialize TurnManager with abandoned typing callback
    const turnManager = useRef(new TurnManager(() => setInputValue("")));

    const chatHelpers = useChat({
        id: chatId,
        generateId: generateUUID,
        onFinish: () => {
            if (onNewMessage && messages.length === 0) onNewMessage();
        },
    });

    const { messages, sendMessage, status, setMessages, stop } = chatHelpers;

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        // Track typing for TurnManager
        turnManager.current.addMessage(text);

        const requestOptions = {
            body: {
                id: chatId,
                selectedChatModel: 'chat-model',
                selectedVisibilityType: 'private',
            }
        };

        // Merge if needed
        if (turnManager.current.shouldMerge()) {
            const lastUserIndex = messages.findLastIndex(m => m.role === 'user');

            if (lastUserIndex !== -1) {
                stop(); // cancel AI response

                const lastUserMsg = messages[lastUserIndex];
                const lastContent = (lastUserMsg as any).parts
                    ? (lastUserMsg as any).parts
                        .filter((p: any) => p.type === 'text')
                        .map((p: any) => p.text)
                        .join("\n")
                    : (lastUserMsg as any).content;

                const mergedText = (lastContent || '') + "\n" + turnManager.current.getMergedMessage();

                const keptMessages = messages.slice(0, lastUserIndex);
                setMessages(keptMessages);

                turnManager.current.onSend();

                // Re-send with merged content using sendMessage
                setTimeout(() => sendMessage({
                    role: 'user',
                    content: mergedText
                } as any, requestOptions), 50);

                setInputValue(""); // clear input after sending
                return;
            }
        }

        // Normal send using sendMessage
        turnManager.current.onSend();
        sendMessage({
            role: 'user',
            content: text
        } as any, requestOptions);
        setInputValue("");
    };

    const { data: initialMessages, isLoading: isLoadingMessages } = useSWR(
        `/api/messages?chatId=${chatId}`,
        fetcher
    );

    // Populate initial messages
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

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, status]);

    const activeConversation: any = {
        id: chatId,
        name: 'Chat',
        recipients: [],
        messages: [],
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
    };

    const getMessageStatus = (message: any) => (message.role === 'user' ? 'sent' : null);

    const formatTimestamp = (date: Date) => new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);

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
                            <AnimatePresence initial={false} mode="popLayout">
                                {messages.map((m, index) => {
                                    const messageStatus = getMessageStatus(m);
                                    const messageDate = (m as any).createdAt;
                                    const showTime = showTimestamps && messageDate;

                                    return (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                                            className={cn(
                                                "flex flex-col w-full",
                                                m.role === 'user' ? "items-end" : "items-start"
                                            )}
                                        >
                                            {/* Calculate distinct message bubbles from splits */}
                                            {(() => {
                                                const parts = m.parts || ((m as any).content ? [{ type: 'text', text: (m as any).content }] : []);
                                                const textContent = parts
                                                    .filter((p: any) => p.type === 'text')
                                                    .map((p: any) => p.text)
                                                    .join('');

                                                // Split by delimiter if present
                                                const splitContent = textContent.split('<SPLIT>');

                                                return splitContent.map((contentChunk: string, chunkIndex: number) => (
                                                    <motion.div
                                                        key={`${m.id}-${chunkIndex}`}
                                                        layout
                                                        className={cn(
                                                            "flex w-full items-end gap-2 mb-2 last:mb-0",
                                                            m.role === 'user' ? "justify-end" : "justify-start"
                                                        )}
                                                    >
                                                        {m.role === 'assistant' && chunkIndex === 0 && (
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg border border-white/10 shrink-0">
                                                                <Sparkles className="w-4 h-4 text-white" />
                                                            </div>
                                                        )}
                                                        <div
                                                            className={cn(
                                                                "max-w-[85%] p-4 px-6 text-[15px] leading-relaxed break-words shadow-lg transition-all duration-300 hover:shadow-xl group backdrop-blur-md",
                                                                m.role === 'user'
                                                                    ? "bg-gradient-to-br from-primary to-purple-600 text-white rounded-[24px] rounded-br-sm border border-white/10"
                                                                    : "bg-white/5 border border-white/10 text-foreground rounded-[24px] rounded-bl-sm"
                                                            )}
                                                        >
                                                            <span className="whitespace-pre-wrap">{contentChunk}</span>

                                                            {/* Only show timestamp/status on the very last bubble of the split group */}
                                                            {showTime && chunkIndex === splitContent.length - 1 && (
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
                                                    </motion.div>
                                                ));
                                            })()}

                                            {(m.parts || []).some((p: any) => p.type?.startsWith('tool-')) && (
                                                <div className="mt-2 text-xs text-muted-foreground glass border border-white/5 p-2 px-3 rounded-lg max-w-[80%] ml-1 inline-flex items-center gap-2">
                                                    {(m.parts || []).filter((p: any) => p.type?.startsWith('tool-')).map((part: any, index: number) => (
                                                        <div key={index} className="flex gap-2 items-center">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                                            <span className="font-mono text-[10px] uppercase tracking-wider text-primary/80">
                                                                {part.type.replace('tool-', '')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {(status === 'streaming' || status === 'submitted') && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex justify-start pl-10"
                                >
                                    <TypingIndicator />
                                </motion.div>
                            )}

                            <div ref={scrollRef} className="h-4" />
                        </div>
                    </ScrollArea>
                )}
            </div>

            <div className="w-full bg-background/0 backdrop-blur-none pb-safe z-10 px-4 mb-4">
                <div className="max-w-3xl mx-auto glass-panel rounded-2xl p-2 shadow-2xl ring-1 ring-white/5 flex items-center gap-2">
                    <MessageInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSendMessage={handleSendMessage}
                        onTyping={() => turnManager.current.onTyping()}
                    />
                </div>
            </div>
        </div>
    );
}
