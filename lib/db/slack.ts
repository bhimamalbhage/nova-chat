import { createClient } from '@supabase/supabase-js';

// Use Service Role to bypass RLS since Slack Webhooks have no user session
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.warn('Missing SUPABASE_SERVICE_ROLE_KEY. Slack linking may fail due to RLS.');
}

// Fallback to Anon key if Service Key missing (will likely fail RLS, but better than crash)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function getNovaUserBySlackId(slackId: string): Promise<string | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('slack_links')
            .select('nova_user_id')
            .eq('slack_user_id', slackId)
            .single();

        if (error || !data) return null;
        return data.nova_user_id;
    } catch (e) {
        console.warn('Slack Link Table missing or error', e);
        return null;
    }
}

export async function linkSlackUser(slackId: string, novaUserId: string) {
    const { error } = await supabaseAdmin
        .from('slack_links')
        .upsert({
            slack_user_id: slackId,
            nova_user_id: novaUserId
        });

    if (error) {
        throw error;
    }
}
