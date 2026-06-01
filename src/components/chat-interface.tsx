"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Trash2, ArrowLeft, Bot, User, MessageSquare } from "lucide-react";
import { ChatMessage } from "@/lib/types";

interface ChatInterfaceProps {
    namespace: string;
    docId: string;
    siteName: string;
}

export default function ChatInterface({ namespace, docId, siteName }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load chat history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`chat-history-${docId}`);
        if (saved) {
            try {
                setMessages(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        }
    }, [docId]);

    // Save chat history to localStorage
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(`chat-history-${docId}`, JSON.stringify(messages));
        }
    }, [messages, docId]);

    // Handle auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: input.trim(),
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: userMessage.content,
                    namespace,
                    docId,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get AI response");
            }

            const aiMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.answer,
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error: unknown) {
            console.error("Chat error:", error);
            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
                timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        if (confirm("Are you sure you want to clear this chat history?")) {
            setMessages([]);
            localStorage.removeItem(`chat-history-${docId}`);
        }
    };

    return (
        <div className="flex flex-col h-full glass-card rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/10 rounded-2xl text-accent">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-foreground">{siteName}</h2>
                        <p className="text-xs text-foreground/40 uppercase tracking-widest font-medium">Knowledge Assistant</p>
                    </div>
                </div>
                <button
                    onClick={clearHistory}
                    className="p-3 text-foreground/20 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"
                    title="Clear chat history"
                >
                    <Trash2 size={20} />
                </button>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/5"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="p-6 bg-white/5 rounded-full">
                            <MessageSquare size={48} className="text-foreground/20" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">No messages yet</p>
                            <p className="text-sm">Ask me anything about {siteName}!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        >
                            <div className={`p-2 rounded-xl shrink-0 ${msg.role === "user" ? "bg-accent/10 text-accent" : "bg-white/10 text-foreground/60"
                                }`}>
                                {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className={`max-w-[80%] space-y-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                    ? "bg-accent text-white shadow-lg shadow-accent/20 rounded-tr-none"
                                    : "glass text-foreground/80 rounded-tl-none border border-white/5"
                                    }`}>
                                    {msg.content}
                                </div>
                                <p className="text-[10px] text-foreground/20 font-mono">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-white/10 rounded-xl text-foreground/60">
                            <Bot size={20} className="animate-pulse" />
                        </div>
                        <div className="glass p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1">
                            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white/5 border-t border-white/5">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative group"
                >
                    <input
                        type="text"
                        placeholder="Ask a question..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="w-full bg-background/50 border border-border-subtle rounded-2xl py-5 pl-6 pr-16 outline-none transition-all focus:border-accent/50 focus:ring-4 focus:ring-accent/5"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-accent hover:bg-accent/90 disabled:opacity-30 disabled:hover:scale-100 text-white rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
