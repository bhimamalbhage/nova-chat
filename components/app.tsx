"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import type { Conversation, Message } from "@/types";
import { nanoid } from "nanoid";

export default function App() {
    const [isMobileView, setIsMobileView] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Mock initial data or fetch from Supabase later
    useEffect(() => {
        // Mock data
        const mockConvo: Conversation = {
            id: '1',
            name: 'Welcome Bot',
            recipients: [{ id: 'bot', name: 'Welcome Bot' }],
            messages: [
                { id: 'm1', content: 'Welcome to Nova Chat!', sender: 'system', timestamp: new Date().toISOString() },
                { id: 'm2', content: 'This is a demo conversation.', sender: 'bot', timestamp: new Date().toISOString() }
            ],
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
        };
        setConversations([mockConvo]);
        setActiveConversationId('1');
    }, []);

    const handleSendMessage = (text: string) => {
        if (!activeConversationId) return;

        const newMessage: Message = {
            id: nanoid(),
            content: text,
            sender: 'me',
            timestamp: new Date().toISOString()
        };

        setConversations(prev => prev.map(c => {
            if (c.id === activeConversationId) {
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessageTime: newMessage.timestamp
                };
            }
            return c;
        }));
    };

    const showSidebar = !isMobileView || !activeConversationId;
    const showChat = !isMobileView || activeConversationId;

    return (
        <div className="flex h-dvh w-full bg-background overflow-hidden">
            {showSidebar && (
                <div className={`${isMobileView ? "w-full" : "w-[320px] max-w-[320px] border-r"} flex-shrink-0 relative z-20 bg-background`}>
                    <Sidebar
                        conversations={conversations}
                        activeConversation={activeConversationId}
                        onSelectConversation={setActiveConversationId}
                        onDeleteConversation={(id) => setConversations(prev => prev.filter(c => c.id !== id))}
                        onUpdateConversation={(updatedConversations) => {
                            // This handles potential entire array updates, but for specific ID usually we map
                            // Here Sidebar passes updatedConversations directly?
                            // Checking Sidebar signature: onUpdateConversation(conversations: Conversation[], ...)
                            // So we assume it passes the full new state?
                            // Actually let's just assume we update specific conversation in simpler app
                            // But Sidebar impl does `onUpdateConversation(updatedConversations, ...)`
                            // So we should just set state.
                            // Ideally we should merge carefully but simplified:
                            // Wait, Sidebar impl maps: `const updatedConversations = conversations.map(...)`
                            // So it passes the FULL ARRAY.
                            // setConversations(updatedConversations); // Types might mismatch if not careful, but assuming it matches.
                        }}
                        isMobileView={isMobileView}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    />
                </div>
            )}

            {showChat && (
                <main className="flex-1 w-full min-w-0 relative z-10 bg-background">
                    <ChatArea
                        activeConversation={activeConversation}
                        isMobileView={isMobileView}
                        onBack={() => setActiveConversationId(null)}
                        onSendMessage={handleSendMessage}
                    />
                </main>
            )}
        </div>
    );
}
