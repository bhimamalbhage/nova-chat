"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Calendar, CheckCircle2, XCircle, Loader2, ExternalLink, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IntegrationStatus {
    connected: boolean;
    account?: {
        id: string;
        status: string;
        createdAt: string;
    } | null;
    error?: string;
}

export function IntegrationsSettings() {
    const [gmailStatus, setGmailStatus] = useState<IntegrationStatus | null>(null);
    const [calendarStatus, setCalendarStatus] = useState<IntegrationStatus | null>(null);

    const [isLoadingGmail, setIsLoadingGmail] = useState(true);
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);

    const [isConnectingGmail, setIsConnectingGmail] = useState(false);
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);

    const [isDisconnectingGmail, setIsDisconnectingGmail] = useState(false);
    const [isDisconnectingCalendar, setIsDisconnectingCalendar] = useState(false);

    const [notionStatus, setNotionStatus] = useState<IntegrationStatus | null>(null);
    const [isLoadingNotion, setIsLoadingNotion] = useState(true);
    const [isConnectingNotion, setIsConnectingNotion] = useState(false);
    const [isDisconnectingNotion, setIsDisconnectingNotion] = useState(false);

    const { toast } = useToast();

    useEffect(() => {
        checkGmailStatus();
        checkCalendarStatus();
        checkNotionStatus();
    }, []);

    const checkGmailStatus = async () => {
        try {
            setIsLoadingGmail(true);
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
            setIsLoadingGmail(false);
        }
    };

    const checkCalendarStatus = async () => {
        try {
            setIsLoadingCalendar(true);
            const response = await fetch('/api/integrations/google-calendar/status');
            const data = await response.json();
            setCalendarStatus(data);
        } catch (error) {
            console.error('Failed to check Calendar status:', error);
            // Don't toast for initial check failure to avoid spamming if not connected
        } finally {
            setIsLoadingCalendar(false);
        }
    };

    const handleConnectGmail = async () => {
        try {
            setIsConnectingGmail(true);
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
            setIsConnectingGmail(false);
        }
    };

    const handleConnectCalendar = async () => {
        try {
            setIsConnectingCalendar(true);
            const response = await fetch('/api/integrations/google-calendar/connect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success && data.redirectUrl) {
                // Open Composio OAuth flow in new window
                window.location.href = data.redirectUrl;
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to initiate Calendar connection",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Failed to connect Calendar:', error);
            toast({
                title: "Error",
                description: "Failed to initiate Calendar connection",
                variant: "destructive",
            });
        } finally {
            setIsConnectingCalendar(false);
        }
    };

    const handleDisconnectGmail = async () => {
        try {
            setIsDisconnectingGmail(true);
            const response = await fetch('/api/integrations/gmail/disconnect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Gmail account disconnected successfully",
                });
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
            setIsDisconnectingGmail(false);
        }
    };

    const handleDisconnectCalendar = async () => {
        try {
            setIsDisconnectingCalendar(true);
            const response = await fetch('/api/integrations/google-calendar/disconnect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Calendar account disconnected successfully",
                });
                await checkCalendarStatus();
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to disconnect Calendar",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Failed to disconnect Calendar:', error);
            toast({
                title: "Error",
                description: "Failed to disconnect Calendar",
                variant: "destructive",
            });
        } finally {
            setIsDisconnectingCalendar(false);
        }
    };

    const checkNotionStatus = async () => {
        try {
            setIsLoadingNotion(true);
            const response = await fetch('/api/integrations/notion/status');
            const data = await response.json();
            setNotionStatus(data);
        } catch (error) {
            console.error('Failed to check Notion status:', error);
        } finally {
            setIsLoadingNotion(false);
        }
    };

    const handleConnectNotion = async () => {
        try {
            setIsConnectingNotion(true);
            const response = await fetch('/api/integrations/notion/connect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success && data.redirectUrl) {
                window.location.href = data.redirectUrl;
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to initiate Notion connection",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Failed to connect Notion:', error);
            toast({
                title: "Error",
                description: "Failed to initiate Notion connection",
                variant: "destructive",
            });
        } finally {
            setIsConnectingNotion(false);
        }
    };

    const handleDisconnectNotion = async () => {
        try {
            setIsDisconnectingNotion(true);
            const response = await fetch('/api/integrations/notion/disconnect', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Success",
                    description: "Notion account disconnected successfully",
                });
                await checkNotionStatus();
            } else {
                toast({
                    title: "Error",
                    description: data.error || "Failed to disconnect Notion",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error('Failed to disconnect Notion:', error);
            toast({
                title: "Error",
                description: "Failed to disconnect Notion",
                variant: "destructive",
            });
        } finally {
            setIsDisconnectingNotion(false);
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

            {/* Gmail Card */}
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
                        {isLoadingGmail ? (
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
                                        disabled={isLoadingGmail}
                                    >
                                        {isLoadingGmail ? (
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
                                        disabled={isDisconnectingGmail}
                                    >
                                        {isDisconnectingGmail ? (
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
                                disabled={isConnectingGmail}
                                className="gap-2"
                            >
                                {isConnectingGmail ? (
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

            {/* Google Calendar Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Calendar className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Google Calendar</CardTitle>
                                <CardDescription>
                                    Manage your schedule and events through AI
                                </CardDescription>
                            </div>
                        </div>
                        {isLoadingCalendar ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : calendarStatus?.connected ? (
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
                            {calendarStatus?.connected
                                ? "Your Google Calendar is connected. The AI can now create, list, and manage events on your behalf."
                                : "Connect your Google Calendar to enable the AI to help manage your schedule."}
                        </p>

                        {calendarStatus?.connected ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Button
                                        variant="outline"
                                        onClick={checkCalendarStatus}
                                        disabled={isLoadingCalendar}
                                    >
                                        {isLoadingCalendar ? (
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
                                        onClick={handleDisconnectCalendar}
                                        disabled={isDisconnectingCalendar}
                                    >
                                        {isDisconnectingCalendar ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Disconnecting...
                                            </>
                                        ) : (
                                            "Disconnect Calendar"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Connected on {calendarStatus.account?.createdAt ? new Date(calendarStatus.account.createdAt).toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={handleConnectCalendar}
                                disabled={isConnectingCalendar}
                                className="gap-2"
                            >
                                {isConnectingCalendar ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="h-4 w-4" />
                                        Connect Calendar
                                        <ExternalLink className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        )}
                        {calendarStatus?.error && (
                            <p className="text-sm text-destructive">
                                Error: {calendarStatus.error}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Notion Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Notion</CardTitle>
                                <CardDescription>
                                    Access and manage your workspace
                                </CardDescription>
                            </div>
                        </div>
                        {isLoadingNotion ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        ) : notionStatus?.connected ? (
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
                            {notionStatus?.connected
                                ? "Your Notion workspace is connected. The AI can now search, view, and create pages on your behalf."
                                : "Connect your Notion workspace to enable the AI to access your notes and docs."}
                        </p>

                        {notionStatus?.connected ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <Button
                                        variant="outline"
                                        onClick={checkNotionStatus}
                                        disabled={isLoadingNotion}
                                    >
                                        {isLoadingNotion ? (
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
                                        onClick={handleDisconnectNotion}
                                        disabled={isDisconnectingNotion}
                                    >
                                        {isDisconnectingNotion ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Disconnecting...
                                            </>
                                        ) : (
                                            "Disconnect Notion"
                                        )}
                                    </Button>
                                    <p className="text-xs text-muted-foreground">
                                        Connected on {notionStatus.account?.createdAt ? new Date(notionStatus.account.createdAt).toLocaleDateString() : 'Unknown'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={handleConnectNotion}
                                disabled={isConnectingNotion}
                                className="gap-2"
                            >
                                {isConnectingNotion ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <FileText className="h-4 w-4" />
                                        Connect Notion
                                        <ExternalLink className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        )}
                        {notionStatus?.error && (
                            <p className="text-sm text-destructive">
                                Error: {notionStatus.error}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="text-base">More Integrations Coming Soon</CardTitle>
                    <CardDescription>
                        We're working on adding more integrations.
                    </CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
}
