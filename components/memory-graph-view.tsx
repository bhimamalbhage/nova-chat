"use client";

import { useState, useCallback, useEffect } from "react";
import { MemoryGraph } from "@supermemory/memory-graph";
import type { DocumentWithMemories } from "@/lib/types/supermemory";
import { Brain } from "lucide-react";

interface MemoryGraphViewProps {
    isActive?: boolean; // Whether the profile chat is currently active
}

export function MemoryGraphView({ isActive = true }: MemoryGraphViewProps) {
    const [documents, setDocuments] = useState<DocumentWithMemories[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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

    // Load initial documents when component becomes active
    const loadInitialDocuments = useCallback(async () => {
        if (!isActive) return;

        console.log("[MemoryGraph] Loading initial documents...");
        setIsLoading(true);
        setError(null);
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
    }, [isActive, fetchDocuments]);

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
        <div className="h-full w-full relative bg-gradient-to-b from-gray-900 to-black overflow-hidden rounded-xl border border-gray-800">
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
                documents={documents}
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
        </div>
    );
}
