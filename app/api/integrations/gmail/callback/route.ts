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

        // Redirect back to the app with success/error status
        if (success === 'true') {
            console.log('[Gmail Callback] Successfully connected Gmail for user:', user.id);
            return redirect('/?gmail=connected');
        } else {
            console.error('[Gmail Callback] Failed to connect Gmail:', error);
            return redirect('/?gmail=error');
        }
    } catch (error) {
        console.error('[Gmail Callback] Error:', error);
        return redirect('/?gmail=error');
    }
}
