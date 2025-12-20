export function TypingIndicator() {
    return (
        <div className="flex items-center gap-2 px-5 py-3.5 bg-card border border-border/50 rounded-[20px] rounded-bl-sm shadow-sm w-fit">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
            </div>
            <span className="text-xs text-muted-foreground ml-1">AI is thinking...</span>
        </div>
    );
}
