import { useState } from "react";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled }: MessageInputProps) {
    const [value, setValue] = useState("");

    const handleSend = () => {
        if (!value.trim()) return;
        onSendMessage(value);
        setValue("");
    }

    return (
        <div className="p-4 w-full">
            <div className="relative flex items-center w-full">
                <input
                    className={cn(
                        "w-full bg-muted/50 border border-transparent rounded-[24px] px-5 pl-5 pr-14 py-3.5",
                        "focus:outline-none focus:bg-background focus:border-border/50 focus:ring-2 focus:ring-primary/10 shadow-sm transition-all duration-200",
                        "placeholder:text-muted-foreground/50 text-base"
                    )}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !disabled && handleSend()}
                    placeholder="Type a message to start..."
                    disabled={disabled}
                    autoComplete="off"
                />
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200",
                        !value.trim() || disabled
                            ? "bg-transparent text-muted-foreground/30 cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                    )}
                >
                    <Icons.arrowUp className="h-5 w-5" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    )
}
