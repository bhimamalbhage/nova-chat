import { useState, useEffect } from "react";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";

interface MessageInputProps {
    value?: string; // optional controlled input
    onChange?: (value: string) => void; // for controlled input
    onSendMessage: (text: string) => void;
    onTyping?: (text: string) => void;
    disabled?: boolean;
}

export function MessageInput({
    value: controlledValue,
    onChange,
    onSendMessage,
    onTyping,
    disabled
}: MessageInputProps) {
    const [internalValue, setInternalValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Determine whether we are using controlled or internal state
    const value = controlledValue ?? internalValue;
    const setValue = onChange ?? setInternalValue;

    const handleSend = () => {
        if (!value.trim()) return;
        onSendMessage(value);
        setValue("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onTyping?.(e.target.value);
    };

    // Optional: trigger typing for initial value on mount
    useEffect(() => {
        if (value && onTyping) onTyping(value);
    }, []);

    return (
        <div className="w-full relative group">
            {/* Glow effect behind input */}
            <div
                className={cn(
                    "absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-[30px] opacity-0 blur transition duration-500 group-hover:opacity-30",
                    isFocused && "opacity-50 duration-200"
                )}
            />

            <div className="relative flex items-center w-full">
                <input
                    className={cn(
                        "w-full bg-[#050511]/80 backdrop-blur-2xl border border-white/10 rounded-[28px] px-6 pl-6 pr-14 py-4",
                        "focus:outline-none focus:bg-[#050511] transition-all duration-300",
                        "placeholder:text-muted-foreground/50 text-[15px] text-foreground leading-relaxed",
                        isFocused && "shadow-2xl ring-1 ring-white/10"
                    )}
                    value={value}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
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
                            : "bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40"
                    )}
                >
                    <Icons.arrowUp className="h-5 w-5" strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
