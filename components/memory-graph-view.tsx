"use client";

import { useState, useCallback, useEffect } from "react";
import { MemoryGraph } from "@supermemory/memory-graph";
import type { DocumentWithMemories } from "@/lib/types/supermemory";
import { Brain, User, RefreshCw, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { signOut } from "@/app/(auth)/actions";
import { motion, AnimatePresence } from "framer-motion";

interface MemoryGraphViewProps {
    isActive?: boolean;
    isMobileView?: boolean;
}

interface ProfileData {
    userId: string;
    static: string[];
    dynamic: string[];
}

export function MemoryGraphView({ isActive = true, isMobileView = false }: MemoryGraphViewProps) {
    const [documents, setDocuments] = useState<DocumentWithMemories[]>([]);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalLoaded, setTotalLoaded] = useState(0);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Fetch documents
    const fetchDocuments = useCallback(
        async (page: number, limit: number = 500) => {
            try {
                console.log(
                    "[MemoryGraph] Fetching documents - page:",
                    page,
                    "limit:",
                    limit,
                );
                const response = await fetch("/api/documents", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        page,
                        limit,
                        sort: "createdAt",
                        order: "desc",
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch documents");
                }

                const data = await response.json();
                console.log(
                    "[MemoryGraph] Received documents:",
                    data.documents?.length || 0,
                );
                return data;
            } catch (err) {
                console.error("[MemoryGraph] Error fetching documents:", err);
                throw err;
            }
        },
        [],
    );

    const fetchProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const data = await response.json();
                setProfileData(data.profile);
            }
        } catch (e) {
            console.error("Failed to fetch profile", e);
        } finally {
            setIsLoadingProfile(false);
        }
    }, []);

    // Load initial documents when component becomes active
    const loadInitialDocuments = useCallback(async () => {
        if (!isActive) return;

        console.log("[MemoryGraph] Loading initial documents...");
        setIsLoading(true);
        setError(null);

        // Fetch profile alongside documents
        fetchProfile();

        try {
            const data = await fetchDocuments(1, 500);
            setDocuments(data.documents || []);
            setTotalLoaded(data.documents?.length || 0);
            setCurrentPage(1);
            setHasMore(data.pagination.currentPage < data.pagination.totalPages);
            setHasInitialized(true); // Mark as initialized after first load
            console.log(
                "[MemoryGraph] Initial load complete. Total loaded:",
                data.documents?.length || 0,
            );
        } catch (err) {
            console.error("[MemoryGraph] Initial load error:", err);
            setError(err as Error);
            setHasInitialized(true); // Mark as initialized even on error
        } finally {
            setIsLoading(false);
        }
    }, [isActive, fetchDocuments, fetchProfile]);

    // Load more documents (pagination)
    const loadMoreDocuments = useCallback(async () => {
        if (isLoadingMore || !hasMore || !isActive) return;

        console.log("[MemoryGraph] Loading more documents...");
        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            const data = await fetchDocuments(nextPage, 100);

            if (data.documents && data.documents.length > 0) {
                setDocuments((prev) => [...prev, ...data.documents]);
                setTotalLoaded((prev) => prev + data.documents.length);
                setCurrentPage(nextPage);
                setHasMore(data.pagination.currentPage < data.pagination.totalPages);
                console.log(
                    "[MemoryGraph] Loaded more. Total now:",
                    totalLoaded + data.documents.length,
                );
            } else {
                setHasMore(false);
            }
        } catch (err) {
            console.error("[MemoryGraph] Error loading more documents:", err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [
        currentPage,
        hasMore,
        isLoadingMore,
        isActive,
        fetchDocuments,
        totalLoaded,
    ]);

    // Load documents when component becomes active
    useEffect(() => {
        if (isActive && !hasInitialized && !isLoading) {
            console.log(
                "[MemoryGraph] Component became active, loading documents...",
            );
            loadInitialDocuments();
        }
    }, [isActive, hasInitialized, isLoading, loadInitialDocuments]);

    // Refresh documents periodically while active (only if we have documents)
    useEffect(() => {
        if (!isActive || !hasInitialized || documents.length === 0) return;

        // Refresh every 60 seconds while viewing
        const interval = setInterval(() => {
            console.log("[MemoryGraph] Auto-refreshing documents...");
            loadInitialDocuments();
        }, 60000);

        return () => clearInterval(interval);
    }, [isActive, hasInitialized, documents.length, loadInitialDocuments]);

    return (
        <ResizablePanelGroup
            direction={isMobileView ? "vertical" : "horizontal"}
            className="h-full w-full rounded-xl border border-border bg-background"
        >
            {/* Profile Info Panel */}
            <ResizablePanel
                defaultSize={30}
                minSize={20}
                maxSize={isMobileView ? 80 : 50}
                className="flex flex-col bg-card"
            >
                <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Profile Memory
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => { fetchProfile(); loadInitialDocuments(); }} disabled={isLoading || isLoadingProfile}>
                        <RefreshCw className={`w-4 h-4 ${isLoading || isLoadingProfile ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {profileData ? (
                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="space-y-2"
                            >
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Container Tag</h3>
                                <div className="p-3 bg-muted rounded-md font-mono text-xs break-all border border-border/50">
                                    {profileData.userId}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="space-y-2"
                            >
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Static Facts</h3>
                                {profileData.static && profileData.static.length > 0 ? (
                                    <ul className="space-y-2">
                                        <AnimatePresence>
                                            {profileData.static.map((item, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.3 + i * 0.05 }}
                                                    className="text-sm p-3 bg-card shadow-sm rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                                                >
                                                    {item}
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No static facts known yet.</p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="space-y-2"
                            >
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Dynamic Facts</h3>
                                {profileData.dynamic && profileData.dynamic.length > 0 ? (
                                    <ul className="space-y-2">
                                        <AnimatePresence>
                                            {profileData.dynamic.map((item, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.4 + i * 0.05 }}
                                                    className="text-sm p-3 bg-card shadow-sm rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                                                >
                                                    {item}
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No dynamic facts known yet.</p>
                                )}
                            </motion.div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-40 text-muted-foreground">
                            {isLoadingProfile ? "Loading profile..." : "No profile data"}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t border-border mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                            await signOut();
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </Button>
                </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Graph Area Panel */}
            <ResizablePanel defaultSize={70} className="relative bg-background bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-background">
                {hasInitialized && documents.length === 0 && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="text-center p-8">
                            <div className="text-gray-400 mb-4 flex justify-center">
                                <Brain className="w-16 h-16 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-300 mb-2">
                                No Memories Yet
                            </h3>
                            <p className="text-sm text-gray-500">
                                Start chatting to create your memory graph
                            </p>
                        </div>
                    </div>
                )}
                <MemoryGraph
                    documents={documents as any}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    error={error}
                    totalLoaded={totalLoaded}
                    hasMore={hasMore}
                    loadMoreDocuments={loadMoreDocuments}
                    variant="consumer"
                    showSpacesSelector={false}
                    autoLoadOnViewport={true}
                />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
