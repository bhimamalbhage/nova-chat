
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Simple security check
        if (secret !== process.env.CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = searchParams.get('userId');

        if (userId) {
            // Run for specific user (Testing / Single User Mode)
            const { ProactiveAgent } = await import('@/lib/ai/proactive-agent');
            await ProactiveAgent.run(userId);
            return NextResponse.json({ success: true, message: `Proactive check initiated for user ${userId}` });
        } else {
            // TODO: specific implementation to iterate all users
            // const users = await getAllUsers();
            // for (const user of users) await ProactiveAgent.run(user.id);

            return NextResponse.json({ success: false, message: 'No userId provided. Bulk iteration not yet implemented.' });
        }

    } catch (error) {
        console.error('[Proactive Cron] Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
