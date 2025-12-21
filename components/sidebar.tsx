"use client";

import { type ReactNode, useState, useEffect } from "react";
import type { Conversation } from "../types";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";
import { ConversationItem } from "./conversation-item";
import { ScrollArea } from "./ui/scroll-area";
import { ThemeToggle } from "./theme-toggle"; // Added import
import { format, isToday, isYesterday, isThisWeek, parseISO } from "date-fns";
import { useTheme } from "next-themes";

interface SidebarProps {
    children?: ReactNode;
    conversations: Conversation[];
    activeConversation: string | null;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onUpdateConversation: (conversations: Conversation[], updateType?: "pin" | "mute") => void;
    isMobileView: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    typingStatus?: { conversationId: string; recipient: string } | null;
    isCommandMenuOpen?: boolean;
    onScroll?: (isScrolled: boolean) => void;
    onSoundToggle?: () => void;
}

export function Sidebar({
    children,
    conversations,
    activeConversation,
    onSelectConversation,
    onDeleteConversation,
    onUpdateConversation,
    isMobileView,
    searchTerm,
    onSearchChange,
    typingStatus = null,
    isCommandMenuOpen = false,
    onScroll,
    onSoundToggle,
}: SidebarProps) {
    const { theme, systemTheme, setTheme } = useTheme();
    const effectiveTheme = theme === "system" ? systemTheme : theme;
    const [openSwipedConvo, setOpenSwipedConvo] = useState<string | null>(null);

    const formatTime = (timestamp: string | undefined) => {
        if (!timestamp) return "";

        try {
            const date = parseISO(timestamp);

            if (isToday(date)) {
                return format(date, "h:mm a");
            }

            if (isYesterday(date)) {
                return "Yesterday";
            }

            if (isThisWeek(date)) {
                return format(date, "EEEE");
            }

            return format(date, "M/d/yy");
        } catch (error) {
            console.error("Error formatting time:", error, timestamp);
            return "Just now";
        }
    };

    const getInitials = (name: string) => {
        const names = name.split(" ");
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const sortedConversations = [...conversations].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;

        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
    });

    const filteredConversations = sortedConversations.filter((conversation) => {
        if (!searchTerm) return true;

        const hasMatchInMessages = conversation.messages
            .filter((message) => message.sender !== "system")
            .some((message) =>
                message.content.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const hasMatchInNames = conversation.recipients.some((recipient) =>
            recipient.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return hasMatchInMessages || hasMatchInNames;
    });

    // Simplified Keyboard navigation removed for brevity, can be added back if needed

    return (
        <div
            className={cn(
                "flex flex-col h-full border-r border-white/5",
                isMobileView ? "bg-background" : "glass"
            )}
        >
            {children}
            <div className="flex-1 overflow-hidden">
                <ScrollArea
                    className="h-full"
                    onScrollCapture={(e: React.UIEvent<HTMLDivElement>) => {
                        const viewport = e.currentTarget.querySelector(
                            "[data-radix-scroll-area-viewport]"
                        );
                        if (viewport) {
                            onScroll?.(viewport.scrollTop > 0);
                        }
                    }}
                    isMobile={isMobileView}
                    withVerticalMargins={false}
                    bottomMargin="0px"
                >
                    <div className={`${isMobileView ? "w-full" : "w-[320px]"} px-3 py-2 space-y-2`}>
                        <SearchBar value={searchTerm} onChange={onSearchChange} />
                        <div className="w-full pt-2">
                            {filteredConversations.length === 0 && searchTerm ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No results found
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredConversations.map((conversation, index, array) => {
                                        const isActive = conversation.id === activeConversation;
                                        const nextConversation = array[index + 1];
                                        const isNextActive =
                                            nextConversation?.id === activeConversation;

                                        return (
                                            <ConversationItem
                                                key={conversation.id}
                                                // data-conversation-id={conversation.id}
                                                conversation={{
                                                    ...conversation,
                                                    isTyping:
                                                        typingStatus?.conversationId === conversation.id,
                                                }}
                                                activeConversation={activeConversation}
                                                onSelectConversation={onSelectConversation}
                                                onDeleteConversation={onDeleteConversation}
                                                onUpdateConversation={onUpdateConversation}
                                                conversations={conversations}
                                                formatTime={formatTime}
                                                getInitials={getInitials}
                                                isMobileView={isMobileView}
                                                showDivider={false} // Removed divider for cleaner look
                                                openSwipedConvo={openSwipedConvo}
                                                setOpenSwipedConvo={setOpenSwipedConvo}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </div>
            <div className="p-3 border-t border-white/5 flex justify-between items-center bg-black/10 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground/60 px-2">
                    Nova Chat v0.1
                </div>
                <ThemeToggle />
            </div>
        </div>
    );
}
