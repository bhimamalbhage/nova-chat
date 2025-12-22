

import { ProactiveAgent } from '@/lib/ai/proactive-agent';
import { config } from 'dotenv';
import path from 'path';

// Load env
config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
    console.log('Running Proactive Agent Test...');
    const userId = process.env.TEST_USER_ID || 'test-user-id';

    if (!process.env.COMPOSIO_API_KEY) {
        console.warn('Warning: COMPOSIO_API_KEY not found in environment.');
    }

    try {
        await ProactiveAgent.run(userId);
        console.log('Proactive Agent finished successfully.');
    } catch (error) {
        console.error('Proactive Agent failed:', error);
    }
}

main();
