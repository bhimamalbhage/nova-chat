import { Composio } from '@composio/core';

/**
 * Generate a connection link for a user to authenticate their Gmail account
 * This should be called from a separate API endpoint or admin panel
 */
export async function generateGmailConnectionLink(
    composioApiKey: string,
    externalUserId: string,
    redirectUrl?: string
) {
    const composio = new Composio({ apiKey: composioApiKey });

    try {
        // Create a connected account link for the user
        const connection = await composio.connectedAccounts.initiate(
            externalUserId,
            'gmail',
            {
                callbackUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
            }
        );

        return {
            success: true,
            connectionUrl: connection.redirectUrl,
        };
    } catch (error) {
        console.error('Error generating Gmail connection link:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Check if a user has connected their Gmail account
 */
export async function checkGmailConnection(
    composioApiKey: string,
    externalUserId: string
) {
    const composio = new Composio({ apiKey: composioApiKey });

    try {
        const connectedAccounts = await composio.connectedAccounts.list({
            userIds: [externalUserId],
        });

        const gmailAccount = connectedAccounts.items?.find(
            (account: any) => account.appName?.toLowerCase() === 'gmail' || account.providerId === 'GMAIL'
        );

        return {
            isConnected: !!gmailAccount,
            account: gmailAccount,
        };
    } catch (error) {
        console.error('Error checking Gmail connection:', error);
        return {
            isConnected: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
