"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chat-area";
import { MemoryGraphView } from "./memory-graph-view";
import { IntegrationsSettings } from "./integrations-settings";
import { WelcomeState } from "./welcome-state";
import { LoadingSkeleton } from "./loading-skeleton";
import { ThemeToggle } from "./theme-toggle";
import type { Conversation } from "@/types";
import { nanoid } from "nanoid";
import useSWR, { mutate } from "swr";
import { generateChatId } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { User, MessageSquarePlus, LogOut, Settings, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type View = "chat" | "profile" | "integrations";

export default function App() {
    const [isMobileView, setIsMobileView] = useState(false);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentView, setCurrentView] = useState<View>("chat");
    const router = useRouter();

    const { data: history, error, mutate: mutateHistory, isLoading } = useSWR<any[]>('/api/history', fetcher, {
        fallbackData: [],
        refreshInterval: 5000, // Poll every 5 seconds to ensure new chats appear
    });

    const conversations: Conversation[] = history?.map(chat => ({
        id: chat.id,
        name: chat.title || 'New Chat',
        recipients: [],
        messages: [],
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

        try {
            const response = await fetch(`/api/chat?id=${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                console.error('Failed to delete chat');
                mutateHistory(); // Re-fetch to restore in case of error
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            mutateHistory();
        }
    };

    const handleNewChat = () => {
        const newId = generateChatId();
        setActiveConversationId(newId);
        setCurrentView("chat");
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has("notion") || searchParams.has("gmail") || searchParams.has("google-calendar")) {
            setCurrentView("integrations");
        }
    }, []);

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
            });

            if (response.ok) {
                router.push('/login');
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const showSidebar = !isMobileView || (!activeConversationId && currentView === "chat");

    const renderContent = () => {
        if (currentView === "integrations") {
            return (
                <div className="h-full w-full relative overflow-auto">
                    {isMobileView && (
                        <div className="absolute top-4 left-4 z-50">
                            <Button variant="ghost" size="sm" onClick={() => setCurrentView("chat")}>Back</Button>
                        </div>
                    )}
                    <div className="max-w-4xl mx-auto p-6">
                        <IntegrationsSettings />
                    </div>
                </div>
            );
        }

        if (currentView === "profile") {
            return (
                <div className="h-full w-full relative">
                    {isMobileView && (
                        <div className="absolute top-4 left-4 z-50">
                            <Button variant="ghost" size="sm" onClick={() => setCurrentView("chat")}>Back</Button>
                        </div>
                    )}
                    <MemoryGraphView isActive={true} isMobileView={isMobileView} />
                </div>
            );
        }

        if (activeConversationId) {
            return (
                <ChatArea
                    key={activeConversationId}
                    chatId={activeConversationId}
                    isMobileView={isMobileView}
                    onBack={() => setActiveConversationId(null)}
                    onNewMessage={() => {
                        mutateHistory();
                        // Refresh again to catch the auto-generated title
                        setTimeout(() => mutateHistory(), 2000);
                        setTimeout(() => mutateHistory(), 4000);
                    }}
                />
            );
        }

        // Welcome state when no chat selected (Desktop)
        return (
            <WelcomeState
                onNewChat={handleNewChat}
                onViewProfile={() => setCurrentView("profile")}
            />
        );
    };

    return (
        <div className="flex h-dvh w-full bg-background overflow-hidden">
            {/* Sidebar */}
            {(!isMobileView || (!activeConversationId && currentView !== "profile" && currentView !== "integrations")) && (
                <div className={cn(
                    "flex-shrink-0 relative z-20 flex flex-col",
                    isMobileView ? "w-full" : "w-[320px] max-w-[320px]"
                )}>
                    {/* Main Sidebar Component with Header as Children */}
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
                        {/* Fixed Header Content moved inside Sidebar */}
                        <div className={cn(
                            "border-b border-border/40", // Removed border-r since Sidebar handles it. Changed to border-b.
                            isMobileView ? "bg-background" : "bg-muted/30 backdrop-blur-xl"
                        )}>
                            {/* Enhanced Navigation Header */}
                            <div className="p-3 space-y-1">
                                <div className="flex items-center gap-2 px-2 py-3 mb-2">
                                    <div className="p-2 bg-primary/10 rounded-lg">
                                        <Sparkles className="h-5 w-5 text-primary" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="font-semibold text-sm tracking-tight">Nova Chat</h2>
                                    </div>
                                    <ThemeToggle />
                                </div>

                                <Button
                                    variant={activeConversationId && !conversations.find(c => c.id === activeConversationId) ? "secondary" : "default"}
                                    className="w-full justify-start gap-2 shadow-sm"
                                    onClick={handleNewChat}
                                >
                                    <MessageSquarePlus className="h-4 w-4" />
                                    New Chat
                                </Button>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="p-3 space-y-1 border-t border-border/40">
                                <Button
                                    variant={currentView === "profile" ? "secondary" : "ghost"}
                                    className="w-full justify-start gap-2"
                                    onClick={() => {
                                        setCurrentView("profile");
                                        setActiveConversationId(null);
                                    }}
                                >
                                    <User className="h-4 w-4" />
                                    Memory Profile
                                </Button>
                                <Button
                                    variant={currentView === "integrations" ? "secondary" : "ghost"}
                                    className="w-full justify-start gap-2"
                                    onClick={() => {
                                        setCurrentView("integrations");
                                        setActiveConversationId(null);
                                    }}
                                >
                                    <Settings className="h-4 w-4" />
                                    Integrations
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => window.open('/slack/install', '_blank')}
                                >
                                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.52 2.52 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.527 2.527 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.522 2.521 2.527 2.527 0 0 1-2.522-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.522 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.522 2.521A2.527 2.527 0 0 1 15.165 24a2.527 2.527 0 0 1-2.522-2.521v-2.522h2.522zM15.165 17.688a2.527 2.527 0 0 1-2.522-2.521 2.527 2.527 0 0 1 2.522-2.522h6.312A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.522h-6.313z" />
                                    </svg>
                                    Connect Slack
                                </Button>
                            </div>


                        </div>
                    </Sidebar>
                </div>
            )}

            {/* Main Content Area */}
            {(!isMobileView || activeConversationId || currentView === "profile" || currentView === "integrations") && (
                <main className="flex-1 w-full min-w-0 relative z-10 bg-background">
                    {renderContent()}
                </main>
            )}
        </div>
    );
}
