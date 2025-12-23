/**
 * Enhanced Typing-Aware Optimistic Turn Versioning (TA-OTV)
 * 
 * Features:
 * - Merge multiple rapid messages into one turn
 * - Handles abandoned typing
 * - Safe for streaming AI responses
 * - Compatible with existing ChatArea.tsx
 */

export class TurnManager {
    private lastUserSendTime: number = 0;
    private typingStartTime: number | null = null;
    private lastTypingActivity: number = 0;
    private abandonTimeout: NodeJS.Timeout | null = null;

    // Store pending messages to merge
    private pendingMessages: string[] = [];

    // Configuration
    private readonly MERGE_WINDOW = 2000; // 2 seconds merge window
    private readonly ABANDON_TIMEOUT = 5000; // 5 seconds for abandoned typing

    // Optional callback for frontend to clear input on abandoned typing
    private onAbandon?: () => void;

    constructor(onAbandon?: () => void) {
        this.onAbandon = onAbandon;
    }

    /**
     * Call on each keystroke to track activity
     */
    onTyping() {
        const now = Date.now();
        this.lastTypingActivity = now;

        if (!this.typingStartTime) this.typingStartTime = now;

        // Reset abandon timer
        if (this.abandonTimeout) clearTimeout(this.abandonTimeout);
        this.abandonTimeout = setTimeout(() => {
            this.resetTypingState();
            if (this.onAbandon) this.onAbandon();
        }, this.ABANDON_TIMEOUT);
    }

    /**
     * Call when a message is strictly submitted
     */
    addMessage(text: string) {
        if (text.trim()) {
            this.pendingMessages.push(text);
        }
    }

    /**
     * Determines if new message should merge with previous turn
     */
    shouldMerge(): boolean {
        if (!this.typingStartTime) return false; // Only merge if user typed
        if (this.lastUserSendTime === 0) return false; // First message

        const diff = this.typingStartTime - this.lastUserSendTime;
        return diff < this.MERGE_WINDOW;
    }

    /**
     * Get combined pending messages for sending
     */
    getMergedMessage(): string {
        return this.pendingMessages.join("\n");
    }

    /**
     * Call after message is sent
     */
    onSend() {
        this.lastUserSendTime = Date.now();
        this.resetTypingState();
    }

    /**
     * Reset typing state and pending messages
     */
    resetTypingState() {
        this.typingStartTime = null;
        this.lastTypingActivity = 0;
        this.pendingMessages = [];
        if (this.abandonTimeout) clearTimeout(this.abandonTimeout);
        this.abandonTimeout = null;
    }
}
