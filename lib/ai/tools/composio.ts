import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';

export async function createComposioTools(apiKey: string, externalUserId: string) {
    const composio = new Composio({
        apiKey,
        provider: new VercelProvider(),
    });

    try {
        console.log('[Composio] Attempting to load Gmail tools for user:', externalUserId);

        // Get Gmail tools for the specific user
        // Start with send email tool
        const tools = await composio.tools.get(externalUserId, "GMAIL_SEND_EMAIL");

        const toolKeys = Object.keys(tools);
        console.log('[Composio] Successfully loaded Gmail tools:', toolKeys.length, 'tools');
        console.log('[Composio] Tool names:', toolKeys);

        // Try to get more Gmail tools and merge them
        const additionalTools = [
            "GMAIL_FETCH_EMAILS",
            "GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID",
            "GMAIL_REPLY_TO_THREAD",
            "GMAIL_CREATE_EMAIL_DRAFT",
            "GOOGLECALENDAR_CREATE_EVENT",
            "GOOGLECALENDAR_LIST_EVENTS",
            "GOOGLECALENDAR_UPDATE_EVENT",
            "GOOGLECALENDAR_DELETE_EVENT",
            "GOOGLECALENDAR_FIND_EVENT",
            "NOTION_CREATE_NOTION_PAGE",
            "NOTION_SEARCH_NOTION_PAGE",
            "NOTION_FETCH_BLOCK_CONTENTS",
            "NOTION_ADD_MULTIPLE_PAGE_CONTENT",
            "NOTION_UPDATE_PAGE",
            "NOTION_ARCHIVE_NOTION_PAGE"
        ];

        for (const toolName of additionalTools) {
            try {
                const additionalTool = await composio.tools.get(externalUserId, toolName);
                Object.assign(tools, additionalTool);
                console.log(`[Composio] Added ${toolName} tool`);
            } catch (e: any) {
                console.log(`[Composio] ${toolName} not available:`, e.message);
            }
        }

        console.log('[Composio] Final Gmail tools count:', Object.keys(tools).length);

        // Wrap tools with debug logging
        for (const toolName of Object.keys(tools)) {
            const tool = tools[toolName];
            const originalExecute = tool.execute;

            tool.execute = async (...args: any[]) => {
                console.log(`[Composio Debug] 🚀 Executing tool ${toolName}`);
                console.log(`[Composio Debug] Args:`, JSON.stringify(args[0], null, 2));
                try {
                    if (!originalExecute) {
                        throw new Error(`Tool ${toolName} has no execute function`);
                    }
                    const result = await (originalExecute as any)(...args);
                    console.log(`[Composio Debug] ✅ Tool ${toolName} success`);
                    // Log partial result to avoid spamming console
                    const resultStr = JSON.stringify(result, null, 2);
                    console.log(`[Composio Debug] Result:`, resultStr.length > 500 ? resultStr.slice(0, 500) + '...' : resultStr);
                    return result;
                } catch (error: any) {
                    console.error(`[Composio Debug] ❌ Tool ${toolName} failed`);
                    console.error(`[Composio Debug] Error details:`, error.message);
                    console.error(`[Composio Debug] Full error:`, error);
                    throw error;
                }
            };
        }

        return tools;
    } catch (error: any) {
        console.error('[Composio] Error loading Gmail tools:', error.message);
        console.error('[Composio] Error code:', error.code);
        console.error('[Composio] Error status:', error.status);

        // If tool not found or no connected account
        if (error.code === 'TS-SDK::TOOL_NOT_FOUND' || error.status === 404) {
            console.warn('[Composio] Gmail tool not found. This usually means:');
            console.warn('[Composio] 1. Gmail integration is not enabled in your Composio dashboard, OR');
            console.warn('[Composio] 2. User has no connected Gmail account');
            console.warn('[Composio] User ID:', externalUserId);
            console.warn('[Composio] Visit https://app.composio.dev to connect Gmail for this user');
            return {};
        }

        // Re-throw other errors
        throw error;
    }
}

export async function createComposioGmailSendTool(apiKey: string, externalUserId: string) {
    const composio = new Composio({
        apiKey,
        provider: new VercelProvider(),
    });

    try {
        // Get only the Gmail send email tool
        const tools = await composio.tools.get(externalUserId, "GMAIL_SEND_EMAIL");

        console.log('[Composio] Successfully loaded Gmail send tool');
        return tools;
    } catch (error: any) {
        console.error('[Composio] Error loading Gmail send tool:', error.message);

        if (error.code === 'TS-SDK::TOOL_NOT_FOUND' || error.status === 404) {
            console.warn('[Composio] Gmail send email action not found. Please enable Gmail in your Composio dashboard.');
            return {};
        }

        throw error;
    }
}
