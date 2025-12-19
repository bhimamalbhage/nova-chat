import { z } from 'zod';

const textPartSchema = z.object({
    text: z.string().min(1).max(10000),
    type: z.enum(['text']),
});

const filePartSchema = z.object({
    url: z.string().url(),
    name: z.string().min(1).max(2000),
    mediaType: z.enum(['image/png', 'image/jpg', 'image/jpeg', 'text/plain']),
    type: z.enum(['file']),
});

export const postRequestBodySchema = z.object({
    id: z.string().uuid(),
    message: z.object({
        id: z.string().uuid(),
        createdAt: z.coerce.date(),
        role: z.enum(['user']),
        content: z.string().min(1).max(10000),
        parts: z.array(z.union([textPartSchema, filePartSchema])),
    }).optional(),
    messages: z.array(z.any()).optional(),
    selectedChatModel: z.string().optional().default('chat-model'),
    selectedVisibilityType: z.enum(['public', 'private']).optional().default('private'),
});

export type PostRequestBody = z.infer<typeof postRequestBodySchema>;
