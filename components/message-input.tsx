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
        <div className="p-4 px-6 w-full mb-4">
            <div className="relative flex items-center w-full group">
                <input
                    className={cn(
                        "w-full bg-card/40 backdrop-blur-xl border border-white/10 rounded-[28px] px-6 pl-6 pr-14 py-4",
                        "focus:outline-none focus:bg-card/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 shadow-lg transition-all duration-300",
                        "placeholder:text-muted-foreground/60 text-[15px] text-foreground"
                    )}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !disabled && handleSend()}
                    placeholder="Ask anything..."
                    disabled={disabled}
                    autoComplete="off"
                />
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full transition-all duration-300 scale-95 hover:scale-100 active:scale-95",
                        !value.trim() || disabled
                            ? "bg-transparent text-muted-foreground/20 cursor-not-allowed"
                            : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                    )}
                >
                    <Icons.arrowUp className="h-5 w-5" strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}
