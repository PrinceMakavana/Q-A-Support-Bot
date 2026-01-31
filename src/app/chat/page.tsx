"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import ChatInterface from "@/components/chat-interface";
import { Suspense } from "react";

function ChatContent() {
    const searchParams = useSearchParams();
    const namespace = searchParams.get("namespace");
    const docId = searchParams.get("docId");
    const siteName = searchParams.get("siteName");

    if (!namespace || !docId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="p-6 bg-red-500/10 rounded-full text-red-500">
                    <MessageSquare size={48} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold">Invalid Chat Session</h2>
                    <p className="text-foreground/60">We couldn&apos;t find the knowledge base you&apos;re looking for.</p>
                </div>
                <Link
                    href="/"
                    className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-accent/20"
                >
                    <ArrowLeft size={18} />
                    Go Back Home
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col h-[80vh] gap-6">
            <div className="flex items-center justify-between">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-foreground/40 hover:text-accent transition-colors group"
                >
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-accent/10 transition-colors">
                        <ArrowLeft size={16} />
                    </div>
                    <span className="text-sm font-medium">Back to Knowledge Bases</span>
                </Link>
                <div className="text-[10px] font-mono text-foreground/20 uppercase tracking-[0.2em]">
                    Namespace: {namespace}
                </div>
            </div>

            <ChatInterface
                namespace={namespace}
                docId={docId}
                siteName={siteName || "Untitled knowledge base"}
            />
        </div>
    );
}

export default function ChatPage() {
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-start p-6 sm:p-24 overflow-x-hidden">
            {/* Background decoration */}
            <div className="fixed inset-0 grid-bg opacity-50 z-[-2]" />
            <div className="glow-effect top-1/4 -left-1/4 opacity-30" />
            <div className="glow-effect bottom-1/4 -right-1/4 opacity-20" />

            <main className="z-10 w-full max-w-6xl">
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Loader2 className="animate-spin text-accent" size={48} />
                    </div>
                }>
                    <ChatContent />
                </Suspense>
            </main>
        </div>
    );
}
