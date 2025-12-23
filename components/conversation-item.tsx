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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Icons } from "./icons";
import { Sparkles, Zap, MoreHorizontal, Trash2 } from "lucide-react"; // Added imports
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

    // DETECT PROACTIVE CHAT
    const isProactiveRaw = conversation.name?.startsWith('⚡️');
    const [isRead, setIsRead] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (isProactiveRaw) {
            const readChats = JSON.parse(localStorage.getItem('nova_read_proactive_chats') || '[]');
            if (readChats.includes(conversation.id)) {
                setIsRead(true);
            } else {
                // It is unread. Check freshness for animation.
                const timeDiff = new Date().getTime() - new Date(conversation.lastMessageTime || 0).getTime();
                // If it arrived in last 30 seconds, animate
                if (timeDiff < 30000) {
                    setShouldAnimate(true);
                    // Stop animation after 5s
                    const timer = setTimeout(() => setShouldAnimate(false), 5000);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [conversation.id, isProactiveRaw, conversation.lastMessageTime]);

    const handleSelect = () => {
        onSelectConversation(conversation.id);
        if (isProactiveRaw && !isRead) {
            setIsRead(true);
            const readChats = JSON.parse(localStorage.getItem('nova_read_proactive_chats') || '[]');
            if (!readChats.includes(conversation.id)) {
                readChats.push(conversation.id);
                localStorage.setItem('nova_read_proactive_chats', JSON.stringify(readChats));
            }
        }
    };

    const isProactive = isProactiveRaw && !isRead;
    const displayName = isProactiveRaw ? (conversation.name || '').replace('⚡️', '').trim() : (conversation.name || conversation.recipients.map((r) => r.name).join(", "));

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

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteConversation(conversation.id);
    };

    const ConversationContent = (
        <div
            role="button"
            tabIndex={0}
            onClick={handleSelect}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelect(); }}
            className={cn(
                "w-full py-3.5 px-4 text-left relative flex items-center gap-3 transition-all duration-500 rounded-xl group border cursor-pointer",
                shouldAnimate && "scale-[1.02] shadow-xl shadow-primary/20 ring-1 ring-primary/50", // Pop effect
                isActive
                    ? "bg-primary/10 text-primary-foreground shadow-lg shadow-primary/5 border-primary/20 backdrop-blur-md"
                    : isProactive
                        ? "bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30 text-foreground"
                        : "border-transparent hover:bg-white/5 hover:border-white/5 text-muted-foreground hover:text-foreground"
            )}
        >
            {/* Unread/Proactive Indicator */}
            {(conversation.unreadCount > 0 || (isProactive && !isActive)) && (
                <div className={cn(
                    "absolute left-1.5 w-2 h-2 rounded-full flex-shrink-0 animate-pulse box-shadow-glow transition-colors duration-500",
                    isProactive ? "bg-primary" : "bg-primary"
                )} />
            )}

            {/* Avatar / Icon */}
            <div className={cn(
                "w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner transition-all duration-500",
                shouldAnimate && "animate-bounce", // Icon bounces
                isProactive
                    ? "bg-gradient-to-br from-primary to-blue-500 text-primary-foreground"
                    : "bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800"
            )}>
                {isProactive ? (
                    <Zap className="w-5 h-5 fill-current" />
                ) : conversation.recipients[0]?.avatar ? (
                    <img
                        src={conversation.recipients[0].avatar}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className="text-base font-semibold text-muted-foreground">
                        {getInitials(displayName || "Chat")}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden flex-1">
                        <span className={cn("text-sm font-medium truncate transition-colors duration-300", isActive || isProactive ? "text-foreground" : "text-foreground/90")}>
                            {displayName}
                        </span>
                        {conversation.pinned && (
                            <Icons.pin className="w-3 h-3 text-muted-foreground rotate-45 flex-shrink-0 opacity-70" />
                        )}
                    </div>
                    {conversation.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 tabular-nums opacity-70 group-hover:hidden pl-2">
                            {formatTime(conversation.lastMessageTime)}
                        </span>
                    )}
                </div>
            </div>

            {/* Hover Menu */}
            {!isMobileView && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="p-1 hover:bg-black/20 dark:hover:bg-white/20 rounded-md transition-colors text-muted-foreground hover:text-foreground">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive gap-2">
                                <Trash2 className="w-4 h-4" />
                                Delete Chat
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
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
