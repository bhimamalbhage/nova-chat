import { createClient } from '@/utils/supabase/server';

export default async function SlackInstallPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || 'http://localhost:3000'}/api/slack/oauth`;

    // Pass User ID in state to link automatically
    const state = user ? user.id : '';

    const scopes = 'chat:write,im:read,im:history,app_mentions:read';
    const installUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white p-4">
            <div className="max-w-md w-full bg-zinc-900 p-8 rounded-xl border border-zinc-800 shadow-2xl text-center">
                <div className="mb-6 flex justify-center">
                    <svg className="w-16 h-16" viewBox="0 0 128 128">
                        <path fill="#E01E5A" d="M29.58 45.39a15.79 15.79 0 1 1 15.79-15.79v15.79H29.58z" />
                        <path fill="#E01E5A" d="M49.31 49.31h15.79a15.79 15.79 0 0 1-15.79 31.58V49.31z" />
                        <path fill="#36C5F0" d="M82.69 45.39a15.79 15.79 0 1 1-15.79 15.79V45.39h15.79z" />
                        <path fill="#36C5F0" d="M78.69 29.61V13.82a15.79 15.79 0 0 1 31.58 15.79H78.69z" />
                        <path fill="#2EB67D" d="M98.42 82.61a15.79 15.79 0 1 1-15.79 15.79V82.61h15.79z" />
                        <path fill="#2EB67D" d="M78.69 78.69H62.9a15.79 15.79 0 1 1 15.79-31.58v31.58z" />
                        <path fill="#ECB22E" d="M45.31 82.61a15.79 15.79 0 1 1 15.79-15.79v15.79H45.31z" />
                        <path fill="#ECB22E" d="M49.31 98.39v15.79a15.79 15.79 0 0 1-31.58-15.79h31.58z" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold mb-2">Add Nova to Slack</h1>
                <p className="text-zinc-400 mb-8">
                    Bring the power of Nova directly into your team's Slack workspace.
                </p>

                <a
                    href={installUrl}
                    className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-[#4A154B] rounded-lg hover:bg-[#611f69] transition-colors"
                >
                    Add to Custom Workspace
                </a>

                {!clientId && (
                    <p className="mt-4 text-xs text-red-500">
                        Error: SC_CLIENT_ID not configured.
                    </p>
                )}
            </div>
        </div>
    );
}
