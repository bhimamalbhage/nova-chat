import { createClient } from '@/utils/supabase/server';
import { verifyLinkToken } from '@/lib/slack/link';
import { linkSlackUser } from '@/lib/db/slack';
import { redirect } from 'next/navigation';

export default async function SlackLinkPage({
    searchParams,
}: {
    searchParams: Promise<{ token?: string }>;
}) {
    const { token } = await searchParams;

    if (!token) {
        return <div className="p-10 text-red-500">Missing token.</div>;
    }

    const slackId = verifyLinkToken(token);
    if (!slackId) {
        return <div className="p-10 text-red-500">Invalid or expired token.</div>;
    }

    // Check Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Redirect to login, preserving the destination
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-2xl font-bold mb-4">Log in to Link Account</h1>
                <p className="mb-6">You need to be logged in to Nova Chat to link your Slack account.</p>
                <a
                    href={`/login?next=/slack/link?token=${token}`}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Log In
                </a>
            </div>
        );
    }

    // Perform Link
    try {
        await linkSlackUser(slackId, user.id);
    } catch (e) {
        console.error(e);
        return <div className="p-10 text-red-500">Failed to link account. Please contact support.</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-zinc-900 text-white">
            <div className="max-w-md text-center space-y-4">
                <div className="text-5xl mb-4">🎉</div>
                <h1 className="text-3xl font-bold text-green-400">Successfully Linked!</h1>
                <p className="text-zinc-300">
                    Your Slack account is now connected to <strong>{user.email}</strong>.
                </p>
                <p className="text-sm text-zinc-500">
                    You can close this window and continue chatting in Slack.
                </p>
            </div>
        </div>
    );
}
