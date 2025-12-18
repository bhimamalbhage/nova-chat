
import { createClient } from '@/utils/supabase/server';
import { getChatsByUserId } from '@/lib/db/queries';

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return new Response('Unauthorized', { status: 401 });
    }

    const chats = await getChatsByUserId({ id: user.id });
    return Response.json(chats);
}
