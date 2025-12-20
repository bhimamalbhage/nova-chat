import { useState, useEffect } from "react";
import { useSwipeable } from "react-swipeable";
import type { Conversation } from "../types";
import { SwipeActions } from "./swipe-actions";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "./ui/context-menu";
import { Icons } from "./icons";
import { useTheme } from "next-themes";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

interface ConversationItemProps {
    conversation: Conversation;
    activeConversation: string | null;
    onSelectConversation: (id: string) => void;
    onDeleteConversation: (id: string) => void;
    onUpdateConversation: (conversations: Conversation[], updateType?: 'pin' | 'mute') => void;
    conversations: Conversation[];
    formatTime: (timestamp: string | undefined) => string;
    getInitials: (name: string) => string;
    isMobileView?: boolean;
    showDivider?: boolean;
    openSwipedConvo: string | null;
    setOpenSwipedConvo: (id: string | null) => void;
}

export function ConversationItem({
    conversation,
    activeConversation,
    onSelectConversation,
    onDeleteConversation,
    onUpdateConversation,
    conversations,
    formatTime,
    getInitials,
    isMobileView,
    showDivider,
    openSwipedConvo,
    setOpenSwipedConvo,
}: ConversationItemProps) {
    const [isSwiping, setIsSwiping] = useState(false);
    const isSwipeOpen = openSwipedConvo === conversation.id;
    const { theme, systemTheme } = useTheme();
    const isActive = activeConversation === conversation.id;

    useEffect(() => {
        const preventDefault = (e: TouchEvent) => {
            if (isSwiping && e.cancelable) {
                const touch = e.touches[0];
                const prevTouch = e.targetTouches[0];
                if (prevTouch) {
                    const xDiff = Math.abs(touch.clientX - prevTouch.clientX);
                    const yDiff = Math.abs(touch.clientY - prevTouch.clientY);
                    if (xDiff > yDiff) {
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener("touchmove", preventDefault, { passive: false });
        return () => document.removeEventListener("touchmove", preventDefault);
    }, [isSwiping]);

    const handlers = useSwipeable({
        onSwipeStart: () => setIsSwiping(true),
        onSwiped: () => setIsSwiping(false),
        onSwipedLeft: () => {
            setOpenSwipedConvo(conversation.id);
            setIsSwiping(false);
        },
        onSwipedRight: () => {
            setOpenSwipedConvo(null);
            setIsSwiping(false);
        },
        trackMouse: true,
    });

    const handleSwipePin = () => {
        if (!isSwipeOpen) return;
        const updatedConversations = conversations.map((conv) =>
            conv.id === conversation.id ? { ...conv, pinned: !conv.pinned } : conv
        );
        onUpdateConversation(updatedConversations, 'pin');
        setOpenSwipedConvo(null);
    };

    const handleSwipeDelete = () => {
        if (!isSwipeOpen) return;
        onDeleteConversation(conversation.id);
        setOpenSwipedConvo(null);
    };

    const handleSwipeHideAlerts = () => {
        if (!isSwipeOpen) return;
        handleContextMenuHideAlerts();
        setOpenSwipedConvo(null);
    };

    const handleContextMenuPin = () => {
        const updatedConversations = conversations.map((conv) =>
            conv.id === conversation.id ? { ...conv, pinned: !conv.pinned } : conv
        );
        onUpdateConversation(updatedConversations, 'pin');
    };

    const handleContextMenuDelete = () => {
        onDeleteConversation(conversation.id);
    };

    const handleContextMenuHideAlerts = () => {
        const updatedConversations = conversations.map((conv) =>
            conv.id === conversation.id
                ? { ...conv, hideAlerts: !conv.hideAlerts }
                : conv
        );
        onUpdateConversation(updatedConversations, 'mute');
    };

    const ConversationContent = (
        <button
            onClick={() => onSelectConversation(conversation.id)}
            aria-label={`Conversation with ${conversation.recipients
                .map((r) => r.name)
                .join(", ")}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
                "w-full py-3 px-3 text-left relative flex items-center gap-3 transition-all duration-200 rounded-xl group",
                isActive
                    ? "bg-accent/80 text-foreground shadow-sm ring-1 ring-border/50"
                    : "hover:bg-accent/40 text-foreground/80 hover:text-foreground"
            )}
        >
            {conversation.unreadCount > 0 && (
                <div className="absolute left-1 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
            )}

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                {conversation.recipients[0]?.avatar ? (
                    <img
                        src={conversation.recipients[0].avatar}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-base font-semibold text-muted-foreground">
                        {getInitials(conversation.name || conversation.recipients[0]?.name || "Chat")}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <div className="flex justify-between items-center w-full">
                    <span className={cn("text-sm font-medium truncate pr-2 transiiton-colors", isActive ? "text-foreground" : "text-foreground/90")}>
                        {conversation.name || conversation.recipients.map((r) => r.name).join(", ")}
                    </span>
                    {conversation.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums opacity-70">
                            {formatTime(conversation.lastMessageTime)}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between w-full h-4">
                    <div className="flex-1 truncate text-xs text-muted-foreground/80">
                        {conversation.isTyping ? (
                            <span className="text-primary italic text-[10px] animate-pulse">Typing...</span>
                        ) : (
                            conversation.messages.slice(-1)[0]?.content || "No messages yet"
                        )}
                    </div>
                    {conversation.pinned && (
                        <Icons.pin className="w-3 h-3 text-muted-foreground rotate-45 ml-1 opacity-70" />
                    )}
                </div>
            </div>
        </button>
    );

    if (isMobileView) {
        return (
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div {...handlers} className="relative overflow-hidden mb-1">
                        <div
                            className={`transition-transform duration-300 ease-out w-full ${isSwipeOpen ? "transform -translate-x-24" : ""}`}
                        >
                            {ConversationContent}
                        </div>
                        <SwipeActions
                            isOpen={isSwipeOpen}
                            onPin={handleSwipePin}
                            onDelete={handleSwipeDelete}
                            onHideAlerts={handleSwipeHideAlerts}
                            isPinned={conversation.pinned}
                            hideAlerts={conversation.hideAlerts}
                            aria-hidden={!isSwipeOpen}
                        />
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                    {/* Mobile context menu items */}
                    <ContextMenuItem onClick={handleContextMenuPin}>
                        {conversation.pinned ? "Unpin" : "Pin"}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleContextMenuHideAlerts}>
                        {conversation.hideAlerts ? "Show Alerts" : "Hide Alerts"}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleContextMenuDelete} className="text-red-600">
                        Delete
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    } else {
        return (
            <ContextMenu>
                <ContextMenuTrigger className="w-full mb-0.5 block">
                    {ConversationContent}
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={handleContextMenuPin}>
                        {conversation.pinned ? "Unpin Chat" : "Pin Chat"}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleContextMenuHideAlerts}>
                        {conversation.hideAlerts ? "Enable Notifications" : "Mute Notifications"}
                    </ContextMenuItem>
                    <ContextMenuItem onClick={handleContextMenuDelete} className="text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                        Delete Chat
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        );
    }
}
