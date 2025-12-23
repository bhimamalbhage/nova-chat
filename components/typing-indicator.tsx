'use client';

import { motion } from 'framer-motion';

export function TypingIndicator() {
    return (
        <div className="px-5 py-4 bg-white/5 backdrop-blur-md rounded-[24px] rounded-bl-sm w-fit flex items-center gap-1.5 shadow-lg border border-white/10">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-primary to-blue-400 shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                    animate={{
                        y: [0, -8, 0],
                        opacity: [0.4, 1, 0.4],
                        scale: [0.9, 1.1, 0.9]
                    }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.15,
                    }}
                />
            ))}
        </div>
    );
}
