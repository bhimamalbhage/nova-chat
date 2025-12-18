import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { customAlphabet } from 'nanoid';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const nanoid = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    7,
);

export function generateUUID() {
    return crypto.randomUUID();
}

export function generateChatId() {
    return generateUUID();
}
