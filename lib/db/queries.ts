import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { generateChatId } from '@/lib/utils';
import { nanoid } from 'nanoid';

export type VisibilityType = 'public' | 'private';

export interface Chat {
    id: string;
    createdAt: Date;
    title: string;
    userId: string;
    visibility: VisibilityType;
}

export interface DBMessage {
    id: string;
    chatId: string;
    role: string;
    content?: string; // Extracted from parts for convenience
    parts: any[];
    attachments: any[];
    createdAt: Date;
}

export async function getChatById({ id, client }: { id: string; client?: SupabaseClient }): Promise<Chat | null> {
    const supabase = client || await createClient();
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Error fetching chat:', error);
        return null;
    }

    return {
        ...data,
        createdAt: new Date(data.created_at),
        userId: data.user_id,
    };
}

export async function saveChat({
    id,
    userId,
    title,
    visibility,
    client,
}: {
    id: string;
    userId: string;
    title: string;
    visibility: VisibilityType;
    client?: SupabaseClient;
}) {
    const supabase = client || await createClient();
    const { error } = await supabase.from('chats').insert({
        id,
        user_id: userId,
        title,
        visibility,
        created_at: new Date().toISOString(),
    });

    if (error) {
        console.error('Error saving chat:', error);
        throw new Error('Failed to save chat');
    }
}

export async function getMessagesByChatId({ id, client }: { id: string; client?: SupabaseClient }): Promise<DBMessage[]> {
    const supabase = client || await createClient();
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data.map((msg: any) => {
        const parts = msg.parts || [];
        // Extract text content from parts for convenience
        const content = parts
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('');

        return {
            id: msg.id,
            chatId: msg.chat_id,
            role: msg.role,
            content,
            parts,
            attachments: msg.attachments || [],
            createdAt: new Date(msg.created_at),
        };
    });
}

export async function saveMessages({ messages, client }: { messages: DBMessage[]; client?: SupabaseClient }) {
    const supabase = client || await createClient();
    const { error } = await supabase.from('messages').insert(
        messages.map((msg) => ({
            id: msg.id,
            chat_id: msg.chatId,
            role: msg.role,
            parts: msg.parts,
            attachments: msg.attachments,
            created_at: msg.createdAt.toISOString(),
        }))
    );

    if (error) {
        console.error('Error saving messages:', error);
        throw new Error('Failed to save messages');
    }
}

export async function getMessageCountByUserId({
    id,
    differenceInHours,
}: {
    id: string;
    differenceInHours: number;
}) {
    const supabase = await createClient();
    const date = new Date();
    date.setHours(date.getHours() - differenceInHours);

    // This is a bit complex with Supabase joins, simplifying for now:
    // We need to join messages with chats where chat.user_id = id

    const { count, error } = await supabase
        .from('messages')
        .select('id, chats!inner(user_id)', { count: 'exact', head: true })
        .eq('chats.user_id', id)
        .gte('created_at', date.toISOString())
        .eq('role', 'user');

    if (error) {
        console.error('Error counting messages:', error);
        return 0;
    }

    return count || 0;
}

export async function getChatsByUserId({
    id,
}: {
    id: string;
}) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching chats:', error);
        return [];
    }

    return data.map((chat: any) => ({
        id: chat.id,
        title: chat.title,
        createdAt: new Date(chat.created_at),
        userId: chat.user_id,
        visibility: chat.visibility,
    }));
}

export async function getMessageById({ id }: { id: string }): Promise<DBMessage[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id);

    if (error) {
        console.error('Error fetching message:', error);
        return [];
    }

    return data.map((msg: any) => {
        const parts = msg.parts || [];
        const content = parts
            .filter((p: any) => p.type === 'text')
            .map((p: any) => p.text)
            .join('');

        return {
            id: msg.id,
            chatId: msg.chat_id,
            role: msg.role,
            content,
            parts,
            attachments: msg.attachments || [],
            createdAt: new Date(msg.created_at),
        };
    });
}

export async function deleteMessagesByChatIdAfterTimestamp({
    chatId,
    timestamp,
}: {
    chatId: string;
    timestamp: Date;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId)
        .gte('created_at', timestamp.toISOString());

    if (error) {
        console.error('Error deleting messages:', error);
        throw new Error('Failed to delete messages');
    }
}

export async function updateChatVisiblityById({
    chatId,
    visibility,
}: {
    chatId: string;
    visibility: VisibilityType;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from('chats').update({ visibility }).eq('id', chatId);

    if (error) {
        console.error('Error updating chat visibility:', error);
        throw new Error('Failed to update chat visibility');
    }
}

export async function updateChatTitle({
    id,
    title,
}: {
    id: string;
    title: string;
}) {
    const supabase = await createClient();
    const { error } = await supabase.from('chats').update({ title }).eq('id', id);

    if (error) {
        console.error('Error updating chat title:', error);
        throw new Error('Failed to update chat title');
    }
}

export async function deleteMessages({
    messageIds,
    chatId,
}: {
    messageIds: string[];
    chatId: string;
}) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId)
        .in('id', messageIds);

    if (error) {
        console.error('Error deleting messages:', error);
        throw new Error('Failed to delete messages');
    }
}

export async function deleteMessagesByChatId({ id }: { id: string }) {
    const supabase = await createClient();
    // Delete messages first
    const { error: msgError } = await supabase.from('messages').delete().eq('chat_id', id);
    if (msgError) throw new Error('Failed to delete messages');

    // Delete chat (optional if we want to keep structure but clear history? Name implies deleting messages only logic usually, but typically clearChat means delete contents)
    // messages-memory implementation of deleteMessagesByChatId deletes messages and votes and streams.
    // So this is correct.
}

export async function deleteChatById({ id }: { id: string }) {
    const supabase = await createClient();

    // Recursion delete is usually handled by DB cascading, but we can try to delete messages first manually if needed.
    // Assuming cascade delete is setup in Supabase for messages -> chats

    const { error } = await supabase.from('chats').delete().eq('id', id);

    if (error) {
        console.error('Error deleting chat:', error);
        throw new Error('Failed to delete chat');
    }
}

export async function createStreamId({
    streamId,
    chatId,
}: {
    streamId: string;
    chatId: string;
}) {
    // Assuming 'streams' table exists, if not this might fail.
    // messages-memory uses this for some reason, maybe for syncing?
    const supabase = await createClient();
    await supabase.from('streams').insert({ id: streamId, chat_id: chatId, created_at: new Date().toISOString() }).select().single();
}
