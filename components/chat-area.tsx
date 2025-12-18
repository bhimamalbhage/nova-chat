import { Conversation, Message } from '@/types';
import { ScrollArea } from './ui/scroll-area';
import { ConversationHeader } from './conversation-header';
import { MessageInput } from './message-input';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

interface ChatAreaProps {
    activeConversation: Conversation | null;
    isMobileView: boolean;
    onBack: () => void;
    onSendMessage: (text: string) => void;
}

export function ChatArea({ activeConversation, isMobileView, onBack, onSendMessage }: ChatAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeConversation?.messages]);

    if (!activeConversation) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground p-4 text-center">
                <p>Select a conversation or start a new one.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background relative w-full">
            <ConversationHeader isMobileView={isMobileView} onBack={onBack} activeConversation={activeConversation} />

            <div className="flex-1 relative overflow-hidden">
                <ScrollArea className="h-full px-4">
                    <div className="py-4 space-y-4 max-w-3xl mx-auto">
                        {activeConversation.messages.map((m: Message) => (
                            <div key={m.id} className={cn("flex w-full", m.sender === 'me' ? "justify-end" : "justify-start")}>
                                <div
                                    className={cn(
                                        "max-w-[75%] p-3 px-4 rounded-2xl text-[15px] leading-relaxed break-words",
                                        m.sender === 'me'
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
                <MessageInput onSendMessage={onSendMessage} />
            </div>
        </div>
    )
}
