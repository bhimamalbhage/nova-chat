"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import type { Conversation } from "@/types";
import { nanoid } from "nanoid";
import useSWR, { mutate } from "swr";
import { generateChatId } from "@/lib/utils";
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function App() {
    const [isMobileView, setIsMobileView] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();

    const { data: history, error, mutate: mutateHistory } = useSWR<any[]>('/api/history', fetcher, {
        fallbackData: [],
    });

    const conversations: Conversation[] = history?.map(chat => ({
        id: chat.id,
        name: chat.title || 'New Chat',
        recipients: [], // Metadata typically
        messages: [], // We don't load all messages for all chats heavily here, Sidebar assumes some structure. 
        // Sidebar typically needs last message time.
        // Our API response needs to include lastMessageTime if we want sorting.
        // For now, mapping simplified.
        lastMessageTime: chat.createdAt,
        unreadCount: 0,
        pinned: false,
        muted: false
    })) || [];

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleDeleteConversation = async (id: string) => {
        // Optimistic update
        mutateHistory(history?.filter(c => c.id !== id), false);

        // Call Server Action or API to delete
        // For now just local state simulation but we should call API
        // const res = await fetch(`/api/chat?id=${id}`, { method: 'DELETE' });
        // mutateHistory(); 
        // Since we don't have delete endpoint fully wired in App yet, leaving as UI only for now
    };

    const handleNewChat = () => {
        const newId = generateChatId();
        setActiveConversationId(newId);
        // We will let ChatArea handle the actual creation on first message
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
                        onDeleteConversation={handleDeleteConversation}
                        onUpdateConversation={() => { }}
                        isMobileView={isMobileView}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    >
                        <div className="p-2">
                            <button onClick={handleNewChat} className="w-full text-left p-2 hover:bg-muted rounded">New Chat</button>
                        </div>
                    </Sidebar>
                </div>
            )}

            {showChat && (
                <main className="flex-1 w-full min-w-0 relative z-10 bg-background">
                    <ChatArea
                        key={activeConversationId} // Force re-mount on chat change
                        chatId={activeConversationId || generateChatId()}
                        isMobileView={isMobileView}
                        onBack={() => setActiveConversationId(null)}
                        onNewMessage={() => mutateHistory()} // Refresh list on new message
                    />
                </main>
            )}
        </div>
    );
}
