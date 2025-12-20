"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GmailStatus {
    connected: boolean;
    account?: {
        id: string;
        status: string;
        createdAt: string;
    } | null;
    error?: string;
}

export function IntegrationsSettings() {
    const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        checkGmailStatus();
    }, []);

    const checkGmailStatus = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/integrations/gmail/status');
            const data = await response.json();
            setGmailStatus(data);
        } catch (error) {
            console.error('Failed to check Gmail status:', error);
            toast({
                title: "Error",
                description: "Failed to check Gmail connection status",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectGmail = async () => {
        try {
            setIsConnecting(true);
            const response = await fetch('/api/integrations/gmail/connect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success && data.redirectUrl) {
                // Open Composio OAuth flow in new window
                window.location.href = data.redirectUrl;
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to initiate Gmail connection",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Failed to connect Gmail:', error);
            toast({
                title: "Error",
                description: "Failed to initiate Gmail connection",
                variant: "destructive",
            });
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnectGmail = async () => {
        try {
            setIsDisconnecting(true);
            const response = await fetch('/api/integrations/gmail/disconnect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Gmail account disconnected successfully",
                });
                // Refresh status
                await checkGmailStatus();
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to disconnect Gmail",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Failed to disconnect Gmail:', error);
            toast({
                title: "Error",
                description: "Failed to disconnect Gmail",
                variant: "destructive",
            });
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
                <p className="text-muted-foreground">
                    Connect your accounts to unlock more features
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Gmail</CardTitle>
                                <CardDescription>
                                    Send and manage emails through AI
                                </CardDescription>
                            </div>
                        </div>
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : gmailStatus?.connected ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm font-medium">Connected</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <XCircle className="h-5 w-5" />
                                <span className="text-sm font-medium">Not Connected</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {gmailStatus?.connected
                                ? "Your Gmail account is connected. The AI can now send emails and access your inbox on your behalf."
                                : "Connect your Gmail account to enable the AI to send emails, read messages, and help manage your inbox."}
                        </p>

                        {gmailStatus?.connected ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Button
                                        variant="outline"
                                        onClick={checkGmailStatus}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Checking...
                                            </>
                                        ) : (
                                            "Refresh Status"
                                        )}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDisconnectGmail}
                                        disabled={isDisconnecting}
                                    >
                                        {isDisconnecting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Disconnecting...
                                            </>
                                        ) : (
                                            "Disconnect Gmail"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Connected on {gmailStatus.account?.createdAt ? new Date(gmailStatus.account.createdAt).toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <p className="text-sm text-amber-900 dark:text-amber-100">
                                        <strong>Note:</strong> If you can't read emails, you need to:
                                    </p>
                                    <ol className="text-sm text-amber-800 dark:text-amber-200 mt-2 ml-4 list-decimal space-y-1">
                                        <li>Go to Composio dashboard and add read scopes to your Gmail auth config</li>
                                        <li>Click "Disconnect Gmail" above</li>
                                        <li>Click "Connect Gmail" again to re-authorize with new permissions</li>
                                    </ol>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={handleConnectGmail}
                                disabled={isConnecting}
                                className="gap-2"
                            >
                                {isConnecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="h-4 w-4" />
                                        Connect Gmail
                                        <ExternalLink className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        )}

                        {gmailStatus?.error && (
                            <p className="text-sm text-destructive">
                                Error: {gmailStatus.error}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-base">More Integrations Coming Soon</CardTitle>
                    <CardDescription>
                        We're working on adding more integrations like Google Calendar, Slack, and more.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
