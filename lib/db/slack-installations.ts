import { createClient } from '@supabase/supabase-js';

// Use Service Role for token storage (Secure)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : undefined;

export interface SlackInstallation {
    team_id: string;
    team_name: string;
    access_token: string;
    bot_user_id: string;
    installer_user_id?: string; // Nova User ID
}

export async function saveSlackInstallation(install: SlackInstallation) {
    if (!supabaseAdmin) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

    const { error } = await supabaseAdmin
        .from('slack_installations')
        .upsert({
            team_id: install.team_id,
            team_name: install.team_name,
            access_token: install.access_token,
            bot_user_id: install.bot_user_id,
            installer_user_id: install.installer_user_id,
            installed_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error saving slack installation:', error);
        throw error;
    }
}

export async function getSlackAccessToken(teamId: string): Promise<string | null> {
    if (!supabaseAdmin) {
        // Fallback for dev single-tenant mode if not set
        if (process.env.SLACK_BOT_TOKEN) return process.env.SLACK_BOT_TOKEN;
        return null;
    }

    const { data, error } = await supabaseAdmin
        .from('slack_installations')
        .select('access_token')
        .eq('team_id', teamId)
        .single();

    if (error || !data) {
        // Fallback
        if (process.env.SLACK_BOT_TOKEN) return process.env.SLACK_BOT_TOKEN;
        return null;
    }

    return data.access_token;
}
