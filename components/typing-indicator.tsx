'use client';

import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="px-5 py-4 glass rounded-[24px] rounded-bl-sm w-fit flex items-center gap-1.5 shadow-sm border border-white/5 animate-pulse">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-blue-400"
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.15,
                    }}
                />
            ))}
        </div>
    );
}
