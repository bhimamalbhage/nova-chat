
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Always use user ID as container tag
        const containerTag = user.id;
        console.log('[Profile API] Using container tag:', containerTag);

        if (!process.env.SUPERMEMORY_API_KEY) {
            console.log('[Profile API] Supermemory API key not configured, returning empty profile');
            return NextResponse.json(
                {
                    profile: {
                        userId: user.id,
                        static: [],
                        dynamic: [],
                    },
                },
                { status: 200 },
            );
        }

        try {
            // Use the actual Supermemory v4/profile API
            console.log(
                '[Profile API] Fetching profile from Supermemory with containerTag:',
                containerTag,
            );
            const baseUrl = process.env.SUPERMEMORY_BASE_URL || 'https://api.supermemory.ai';
            const response = await fetch(`${baseUrl}/v4/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.SUPERMEMORY_API_KEY,
                },
                body: JSON.stringify({
                    containerTag: containerTag,
                }),
            });

            if (!response.ok) {
                console.error(
                    '[Profile API] Failed to fetch profile:',
                    response.status,
                );
                const errorText = await response.text();
                console.error('[Profile API] Error details:', errorText);

                return NextResponse.json(
                    {
                        profile: {
                            userId: user.id,
                            name: user.email || 'User',
                            email: user.email,
                            summary:
                                'No profile data available yet. Start chatting to build your profile!',
                            memories: [],
                        },
                    },
                    { status: 200 },
                );
            }

            const data = await response.json();
            console.log(
                '[Profile API] Supermemory response:',
                JSON.stringify(data, null, 2),
            );

            // Return the profile data exactly as Supermemory returns it
            const profile = data.profile || data;

            const result = {
                userId: user.id,
                static: profile.static || [],
                dynamic: profile.dynamic || [],
            };

            return NextResponse.json({ profile: result }, { status: 200 });
        } catch (fetchError) {
            console.error(
                '[Profile API] Error fetching from Supermemory:',
                fetchError,
            );

            // Return basic profile if Supermemory API fails
            return NextResponse.json(
                {
                    profile: {
                        userId: user.id,
                        name: user.email || 'User',
                        email: user.email,
                        summary: 'Unable to fetch profile data at this time.',
                        memories: [],
                    },
                },
                { status: 200 },
            );
        }
    } catch (error) {
        console.error('[Profile API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
