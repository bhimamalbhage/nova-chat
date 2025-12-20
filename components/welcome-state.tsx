import { MessageSquarePlus, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface WelcomeStateProps {
    onNewChat: () => void;
    onViewProfile?: () => void;
}

export function WelcomeState({ onNewChat, onViewProfile }: WelcomeStateProps) {
    return (
        <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-md text-center space-y-8 animate-in fade-in duration-700">
                {/* Logo/Icon */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                        <div className="relative bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-3xl border border-border/50 shadow-lg">
                            <Sparkles className="w-16 h-16 text-primary" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Welcome Text */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Welcome to Nova Chat
                    </h1>
                    <p className="text-muted-foreground text-base leading-relaxed">
                        Start a conversation and experience intelligent assistance powered by AI
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        onClick={onNewChat}
                        size="lg"
                        className="w-full gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                        <MessageSquarePlus className="w-5 h-5" />
                        Start New Chat
                    </Button>
                    {onViewProfile && (
                        <Button
                            onClick={onViewProfile}
                            variant="outline"
                            size="lg"
                            className="w-full gap-2"
                        >
                            Explore Features
                        </Button>
                    )}
                </div>

                {/* Feature Highlights */}
                <div className="grid grid-cols-3 gap-4 pt-8 border-t border-border/50">
                    <div className="space-y-1">
                        <div className="text-2xl">⚡</div>
                        <p className="text-xs text-muted-foreground">Fast Responses</p>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl">🔒</div>
                        <p className="text-xs text-muted-foreground">Secure & Private</p>
                    </div>
                    <div className="space-y-1">
                        <div className="text-2xl">🎯</div>
                        <p className="text-xs text-muted-foreground">Context Aware</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
