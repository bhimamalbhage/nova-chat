"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { MemoryGraphView } from "./memory-graph-view";
import type { Conversation } from "@/types";
import { nanoid } from "nanoid";
import useSWR, { mutate } from "swr";
import { generateChatId } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { User, MessageSquarePlus } from "lucide-react";
import { Button } from "./ui/button";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type View = "chat" | "profile";

export default function App() {
    const [isMobileView, setIsMobileView] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentView, setCurrentView] = useState<View>("chat");
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
        setCurrentView("chat");
        // We will let ChatArea handle the actual creation on first message
    };

    // Derived state for showing sidebar/content
    // Mobile: Show sidebar if no active chat AND not viewing profile (or maybe profile replaces sidebar?)
    // Actually, on mobile:
    // - List view: sidebar visible
    // - Chat Detail: chat area visible
    // - Profile Detail: profile area visible

    // For simplicity:
    // Show Sidebar if: Desktop OR (Mobile AND no active conversation AND not profile ?? wait)
    // If we are on mobile, we need to hide sidebar when viewing profile.

    const showSidebar = !isMobileView || (!activeConversationId && currentView === "chat");
    // const showChat = !isMobileView || (activeConversationId && currentView === "chat");
    // const showProfile = currentView === "profile";

    // On mobile, if showProfile is true, we hide sidebar and chat.
    // Ensure logic:
    // Desktop: Sidebar | Content (Chat or Profile)
    // Mobile: Sidebar OR Content (Chat or Profile)

    const renderContent = () => {
        if (currentView === "profile") {
            return (
                <div className="h-full w-full relative">
                    {isMobileView && (
                        <div className="absolute top-4 left-4 z-50">
                            <Button variant="ghost" size="sm" onClick={() => setCurrentView("chat")}>Back</Button>
                        </div>
                    )}
                    <MemoryGraphView isActive={true} />
                </div>
            );
        }

        if (activeConversationId) {
            return (
                <ChatArea
                    key={activeConversationId} // Force re-mount on chat change
                    chatId={activeConversationId}
                    isMobileView={isMobileView}
                    onBack={() => setActiveConversationId(null)}
                    onNewMessage={() => mutateHistory()} // Refresh list on new message
                />
            );
        }

        // Empty state when no chat selected and not profile (Desktop)
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground bg-background">
                Select a conversation or start a new one
            </div>
        );
    };

    return (
        <div className="flex h-dvh w-full bg-background overflow-hidden">
            {/* Sidebar Logic */}
            {(!isMobileView || (!activeConversationId && currentView !== "profile")) && (
                <div className={`${isMobileView ? "w-full" : "w-[320px] max-w-[320px] border-r"} flex-shrink-0 relative z-20 bg-background`}>
                    <Sidebar
                        conversations={conversations}
                        activeConversation={activeConversationId}
                        onSelectConversation={(id) => {
                            setActiveConversationId(id);
                            setCurrentView("chat");
                        }}
                        onDeleteConversation={handleDeleteConversation}
                        onUpdateConversation={() => { }}
                        isMobileView={isMobileView}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                    >
                        <div className="p-2 space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2"
                                onClick={handleNewChat}
                            >
                                <MessageSquarePlus className="h-4 w-4" />
                                New Chat
                            </Button>
                            <Button
                                variant={currentView === "profile" ? "secondary" : "ghost"}
                                className="w-full justify-start gap-2"
                                onClick={() => {
                                    setCurrentView("profile");
                                    setActiveConversationId(null);
                                }}
                            >
                                <User className="h-4 w-4" />
                                Profile
                            </Button>
                        </div>
                    </Sidebar>
                </div>
            )}

            {/* Main Content Area */}
            {(!isMobileView || activeConversationId || currentView === "profile") && (
                <main className="flex-1 w-full min-w-0 relative z-10 bg-background">
                    {renderContent()}
                </main>
            )}
        </div>
    );
}
