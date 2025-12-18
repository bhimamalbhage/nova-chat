import { useState } from "react";
import { Icons } from "./icons";

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

export function MessageInput({ onSendMessage, value: propValue, onChange, disabled }: MessageInputProps) {
    const [localValue, setLocalValue] = useState("");

    // Use prop value if controlled, otherwise local state
    const isControlled = propValue !== undefined;
    const value = isControlled ? propValue : localValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
            onChange(e);
        }
        if (!isControlled) {
            setLocalValue(e.target.value);
        }
    };

    const handleSend = () => {
        if (!value.trim()) return;
        onSendMessage(value);
        if (!isControlled) {
            setLocalValue("");
        }
    }

    return (
        <div className="p-4 border-t bg-background w-full">
            <div className="flex gap-2 items-center max-w-3xl mx-auto w-full">
                <input
                    className="flex-1 bg-muted/50 border-0 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={e => e.key === 'Enter' && !disabled && handleSend()}
                    placeholder="Type a message..."
                    disabled={disabled}
                />
                <button
                    onClick={handleSend}
                    disabled={!value.trim() || disabled}
                    className="bg-blue-500 text-white p-2.5 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Icons.arrowUp className="h-5 w-5" strokeWidth={3} />
                </button>
            </div>
        </div>
    )
}
