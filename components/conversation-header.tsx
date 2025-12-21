import { Icons } from "./icons";
import { Conversation } from "@/types";
import { cn } from "@/lib/utils";

interface ConversationHeaderProps {
    isMobileView?: boolean;
    onBack?: () => void;
    activeConversation?: Conversation | null;
}

export function ConversationHeader({ isMobileView, onBack, activeConversation }: ConversationHeaderProps) {
    const title = activeConversation?.name || activeConversation?.recipients.map(r => r.name).join(", ");

    return (
        <div className="flex items-center px-6 py-3 border-b border-white/5 glass h-[64px] w-full z-20 sticky top-0">
            {isMobileView && (
                <button
                    onClick={onBack}
                    className="mr-3 p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors"
                >
                    <Icons.back className="h-5 w-5" />
                </button>
            )}
            <div className="flex flex-col justify-center">
                <div className="font-semibold text-[15px] leading-tight line-clamp-1 tracking-tight">
                    {title || "New Chat"}
                </div>
                {/* Optional: Add status or member count for more detail */}
            </div>
        </div>
    )
}
