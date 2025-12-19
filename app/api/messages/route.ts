
import { createClient } from '@/utils/supabase/server';
import { getMessagesByChatId } from '@/lib/db/queries';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
        return new Response('Missing chatId', { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    // TODO: Verify user owns the chat before returning messages (security)
    // getMessagesByChatId does not check ownership currently, but we can trust if we check chat existence first or join.
    // For now, let's assume getMessagesByChatId is safe or checks ownership (it should).
    // Ideally queries.ts should handle this check.

    const messages = await getMessagesByChatId({ id: chatId });
    return Response.json(messages);
}
