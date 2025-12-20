import { useEffect, useRef } from "react";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
    const justBlurred = useRef(false);

    useEffect(() => {
        const handleGlobalEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                const searchInput = document.querySelector(
                    'input[placeholder="Search"]'
                );
                if (
                    document.activeElement !== searchInput &&
                    value &&
                    !justBlurred.current
                ) {
                    onChange("");
                }
                justBlurred.current = false;
            }
        };

        window.addEventListener("keydown", handleGlobalEscape);
        return () => window.removeEventListener("keydown", handleGlobalEscape);
    }, [value, onChange]);

    return (
        <div className="relative group">
            <Icons.search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-foreground transition-colors" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        e.preventDefault();
                        if (document.activeElement === e.currentTarget) {
                            justBlurred.current = true;
                            e.currentTarget.blur();
                            setTimeout(() => {
                                justBlurred.current = false;
                            }, 0);
                        }
                    }
                }}
                placeholder="Search messages..."
                className={cn(
                    "w-full pl-9 pr-9 py-2 rounded-xl text-sm transition-all duration-200",
                    "placeholder:text-muted-foreground/70",
                    "focus:outline-none focus:ring-2 focus:ring-primary/10 focus:bg-background",
                    "bg-muted/50 text-foreground border border-transparent focus:border-border/50"
                )}
            />
            {value && (
                <button
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    aria-label="Clear search"
                >
                    <Icons.close className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
