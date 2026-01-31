"use client";

import { useState, useEffect } from "react";
import { Globe, Search, ArrowRight, Loader2, CheckCircle2, AlertCircle, FileText, Database, History, Trash2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface SiteConfig {
  indexName: string;
  namespace: string;
  docId: string;
  siteName: string;
  llmsRules: string;
  url: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [crawledData, setCrawledData] = useState<{
    url: string;
    title: string;
    text: string;
    length: number;
    sitemap?: string;
    llm?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingestedSites, setIngestedSites] = useState<SiteConfig[]>([]);

  // Load ingested sites from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("qa-bot-sites");
    if (saved) {
      try {
        setIngestedSites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved sites", e);
      }
    }
  }, []);

  const handleCrawl = async () => {
    if (!url) return;
    console.log(`[CLIENT] Starting crawl for URL: ${url}`);
    setLoading(true);
    setError(null);
    setCrawledData(null);

    try {
      console.log("[CLIENT] Calling /api/crawl...");
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      // console.log(`[CLIENT] Crawl response status: ${response.status}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong while crawling.");
      }

      // console.log("[CLIENT] Crawl successful. Data received:", data);
      setCrawledData(data);
      toast.success("Crawl complete", { description: "Content is ready to ingest." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong while crawling.";
      console.error("[CLIENT] Crawl failed:", message);
      setError(message);
      toast.error("Crawl failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleIngest = async () => {
    if (!crawledData) return;
    console.log(`[CLIENT] Starting ingestion to Pinecone for: ${crawledData.url}`);
    setIngesting(true);
    setError(null);

    try {
      console.log("[CLIENT] Calling /api/ingest...");
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(crawledData),
      });

      console.log(`[CLIENT] Ingest response status: ${response.status}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to ingest content to Pinecone.");
      }

      console.log("[CLIENT] Ingestion successful. Preparing site metadata for storage...");

      // Save to localStorage
      const newSite: SiteConfig = {
        indexName: data.indexName,
        namespace: data.namespace,
        docId: data.docId,
        siteName: crawledData.title || new URL(crawledData.url).hostname,
        llmsRules: crawledData.llm || "",
        url: crawledData.url,
      };

      const updatedSites = [newSite, ...ingestedSites.filter(s => s.url !== newSite.url)];
      console.log("[CLIENT] Saving site metadata to localStorage:", newSite);
      setIngestedSites(updatedSites);
      localStorage.setItem("qa-bot-sites", JSON.stringify(updatedSites));

      console.log("[CLIENT] Process complete. Resetting UI state.");
      // Reset state after success
      setCrawledData(null);
      setUrl("");
      toast.success("Ingested successfully", { description: "Saved to Pinecone and locally." });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to ingest content to Pinecone.";
      console.error("[CLIENT] Ingestion failed:", message);
      setError(message);
      toast.error("Ingest failed", { description: message });
    } finally {
      setIngesting(false);
    }
  };

  const removeSite = (siteUrl: string) => {
    const updated = ingestedSites.filter(s => s.url !== siteUrl);
    setIngestedSites(updated);
    localStorage.setItem("qa-bot-sites", JSON.stringify(updated));
    toast.success("Removed from knowledge base");
  };

  return (
    <div className="relative h-screen  flex flex-col items-center p-6 sm:p-24">
      {/* Background decoration */}
      <div className="fixed inset-0 grid-bg opacity-50 z-[-2]" />
      <div className="glow-effect top-1/4 -left-1/4 opacity-30" />
      <div className="glow-effect bottom-1/4 -right-1/4 opacity-20" />

      {/* Hero Content - fixed height, no scroll */}
      <main className="z-10 w-full max-w-4xl flex flex-col items-center text-center flex-shrink-0 gap-8">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium text-accent border-accent/20 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Crawler & Ingestor Active
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
            Build Your <span className="text-accent">Knowledge Base</span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground/60 max-w-2xl mx-auto">
            Turn any website into a searchable knowledge base. <br className="hidden sm:block" />
            Ask questions and get accurate answers from your own content.
          </p>
        </div>

        {/* Input Card */}
        <div className="w-full max-w-2xl glass rounded-3xl p-2 shadow-2xl ring-1 ring-white/10 transition-all hover:ring-accent/30">
          <div className="p-2 sm:p-4 flex flex-col gap-4">
            {/* Input Area */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/30 group-focus-within:text-accent transition-colors">
                <Globe size={20} />
              </div>
              <input
                type="text"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                className="w-full bg-background/50 border border-border-subtle rounded-2xl py-5 pl-12 pr-4 outline-none transition-all focus:border-accent/50 focus:ring-4 focus:ring-accent/5"
              />
            </div>

            {/* Bottom Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-1">
              {/* Badge/Info */}
              <div className="flex items-center gap-2 px-4 py-2 bg-background/80 rounded-xl border border-border-subtle text-xs font-medium text-foreground/40">
                <Search size={14} /> Step 1: Crawl URL
              </div>

              {/* Action Button */}
              <button
                disabled={loading || !url || ingesting}
                onClick={handleCrawl}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,77,0,0.3)]"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    Crawl Website
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Results / Feedback Area */}
        {error && (
          <div className="w-full max-w-2xl p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-start gap-3 text-left">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {crawledData && (
          <div className="w-full max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-500 font-medium">
                <CheckCircle2 size={18} />
                Content Ready
              </div>
              <button
                onClick={handleIngest}
                disabled={ingesting}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-all border border-white/10"
              >
                {ingesting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Save & Ingest
                  </>
                )}
              </button>
            </div>

            <div className="glass rounded-2xl p-6 text-left border border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{crawledData.title || "No Title"}</h3>
                    <p className="text-xs text-foreground/40">{crawledData.url}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-accent">{crawledData.length} chars</p>
                  <p className="text-[10px] text-foreground/30 uppercase tracking-widest">Extracted</p>
                </div>
              </div>

              {crawledData.llm && (
                <div className="bg-accent/5 rounded-xl p-3 border border-accent/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <p className="text-[10px] font-bold text-accent uppercase tracking-wider">System Instructions Found (llms.txt)</p>
                  </div>
                  <p className="text-xs text-foreground/60 italic overflow-hidden line-clamp-2">
                    {crawledData.llm}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider">Content Preview (To be Embedded)</p>
                <div className="bg-black/20 rounded-xl p-4 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                    {crawledData.text.slice(0, 1000)}
                    {crawledData.text.length > 1000 && "..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Text */}
        {!crawledData && !loading && ingestedSites.length === 0 && (
          <div className="flex items-center gap-8 text-xs font-mono text-foreground/30 mt-12">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
              READY TO INGEST
            </div>
            <div>GEMINI 1.5 PRO</div>
            <div>PINECONE SERVERLESS</div>
          </div>
        )}
      </main>

      {/* Recently Ingested Knowledge Bases - only scrollable section */}
      {ingestedSites.length > 0 && (
        <div className="z-10 w-full max-w-2xl flex-1 min-h-0 flex flex-col mt-4 overflow-hidden">
          <div className="flex items-center gap-2 text-foreground/60 text-sm font-medium border-b border-white/5 pb-4 flex-shrink-0">
            <History size={16} />
            Recently Ingested Knowledge Bases
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-1 gap-4 py-2">
              {ingestedSites.map((site) => (
                <div key={site.url} className="glass-card group flex items-center justify-between p-4 rounded-2xl border border-white/5 hover:border-accent/30 transition-all shadow-lg hover:shadow-accent/5 min-w-0">
                  <div className="flex items-center gap-4 text-left min-w-0 flex-1">
                    <div className="p-2 bg-white/5 rounded-lg text-foreground/40 group-hover:text-accent transition-colors flex-shrink-0">
                      <Database size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate" title={site.siteName}>{site.siteName}</h4>
                      <p className="text-xs text-foreground/30 truncate" title={site.url}>{site.url}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex flex-col items-end px-4 border-r border-white/5">
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-accent truncate max-w-[140px] hover:underline cursor-pointer"
                        title={site.url}
                      >
                        {site.namespace}
                      </a>
                    </div>
                    <Link
                      href={`/chat?namespace=${site.namespace}&siteName=${encodeURIComponent(site.siteName)}&docId=${site.docId}`}
                      className="p-2 text-foreground/20 hover:text-accent transition-colors"
                      title="Chat with this site"
                    >
                      <MessageSquare size={16} />
                    </Link>
                    <button
                      onClick={() => removeSite(site.url)}
                      className="p-2 text-foreground/20 hover:text-red-500 transition-colors"
                      title="Remove from history"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
