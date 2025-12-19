import { Icons } from "./icons";
import { Conversation } from "@/types";

interface ConversationHeaderProps {
    isMobileView?: boolean;
    onBack?: () => void;
    activeConversation?: Conversation | null;
}

export function ConversationHeader({ isMobileView, onBack, activeConversation }: ConversationHeaderProps) {
    const title = activeConversation?.name || activeConversation?.recipients.map(r => r.name).join(", ");

    return (
        <div className="flex items-center px-4 py-2 border-b bg-background/50 backdrop-blur-md h-16 w-full z-10 sticky top-0">
            {isMobileView && (
                <button onClick={onBack} className="mr-4 p-2 hover:bg-muted rounded-full">
                    <Icons.back className="h-6 w-6" />
                </button>
            )}
            <div className="font-semibold text-lg line-clamp-1">
                {title || "New Chat"}
            </div>
        </div>
    )
}
