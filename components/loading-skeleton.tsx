import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    type?: "message" | "conversation" | "chat-list";
    count?: number;
}

export function LoadingSkeleton({ type = "message", count = 3 }: LoadingSkeletonProps) {
    if (type === "message") {
        return (
            <div className="space-y-6 py-6 max-w-3xl mx-auto px-4">
                {Array.from({ length: count }).map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex w-full animate-pulse",
                            i % 2 === 0 ? "justify-end" : "justify-start"
                        )}
                    >
                        <div
                            className={cn(
                                "h-16 rounded-[20px] bg-muted/50",
                                i % 2 === 0 ? "w-3/5 rounded-br-sm" : "w-4/5 rounded-bl-sm"
                            )}
                        />
                    </div>
                ))}
            </div>
        );
    }

    if (type === "conversation") {
        return (
            <div className="space-y-1 px-3">
                {Array.from({ length: count }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted/50 rounded w-3/4" />
                            <div className="h-3 bg-muted/50 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
}
