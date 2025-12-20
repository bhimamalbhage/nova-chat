import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const success = searchParams.get('success');
        const error = searchParams.get('error');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return redirect('/login');
        }

        if (success === 'true') {
            console.log('[Google Calendar Callback] Successfully connected Google Calendar for user:', user.id);
            return redirect('/?google-calendar=connected');
        } else {
            console.error('[Google Calendar Callback] Failed to connect Google Calendar:', error);
            return redirect('/?google-calendar=error');
        }
    } catch (error) {
        console.error('[Google Calendar Callback] Error:', error);
        return redirect('/?google-calendar=error');
    }
}
