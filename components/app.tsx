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
        mutateHistory(history?.filter(c => c.id !== id), false);
    };

    const handleNewChat = () => {
        const newId = generateChatId();
        setActiveConversationId(newId);
        setCurrentView("chat");
    };

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
                    {/* Fixed Header - Always Visible */}
                    <div className={cn(
                        "border-r border-border/40",
                        isMobileView ? "bg-background" : "bg-muted/30 backdrop-blur-xl"
                    )}>
                        {/* Enhanced Navigation Header */}
                        <div className="p-3 space-y-1 border-b border-border/40">
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
                        <div className="p-3 space-y-1 border-b border-border/40">
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
                        </div>

                        {/* Logout at bottom of fixed header */}
                        <div className="p-3 border-b border-border/40">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Sidebar Content */}
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
                    />
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
