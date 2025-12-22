import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const error = searchParams.get('error');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return redirect('/login');
        }

        // Redirect back to the app with success/error status
        // Using root path because that's where the app component lives, which handles the query params to show settings
        if (status === 'success') {
            console.log('[Notion Callback] Successfully connected Notion for user:', user.id);
            return redirect('/?notion=connected');
        } else {
            console.error('[Notion Callback] Failed to connect Notion:', error);
            // Append error message to URL if possible, but keep it simple
            const errorMsg = error ? encodeURIComponent(error) : 'Unknown error';
            return redirect(`/?notion=error&message=${errorMsg}`);
        }
    } catch (error) {
        console.error('[Notion Callback] Error:', error);
        return redirect('/?notion=error');
    }
}
