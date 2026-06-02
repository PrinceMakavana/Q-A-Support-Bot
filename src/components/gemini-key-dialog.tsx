"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Loader2, Save } from "lucide-react";

interface GeminiKeyDialogProps {
  open: boolean;
  onSave: (apiKey: string) => void;
}

export default function GeminiKeyDialog({ open, onSave }: GeminiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey("");
      setError(null);
      setValidating(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError("Gemini API key is required.");
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const response = await fetch("/api/validate-gemini-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ googleApiKey: trimmedKey }),
      });
      const data = await response.json();

      if (!response.ok || !data.valid) {
        throw new Error(data.error || "Gemini API key is invalid.");
      }

      onSave(trimmedKey);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to validate Gemini API key."
      );
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md glass border border-white/10 bg-card/95 p-6 text-left shadow-2xl"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Gemini API Key</h2>
            <p className="text-sm text-foreground/50">Saved for this browser session.</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-foreground/30 group-focus-within:text-accent transition-colors">
            <KeyRound size={18} />
          </div>
          <input
            type="password"
            placeholder="Paste your Gemini API key"
            value={apiKey}
            disabled={validating}
            onChange={(event) => {
              setApiKey(event.target.value);
              setError(null);
            }}
            className="w-full bg-background/60 border border-border-subtle rounded-xl py-4 pl-12 pr-4 outline-none transition-all focus:border-accent/50 focus:ring-4 focus:ring-accent/5"
            autoComplete="off"
            autoFocus
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={validating}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-white shadow-[0_0_20px_rgba(255,77,0,0.25)] transition-all hover:bg-accent/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {validating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Save size={18} />
              Save
            </>
          )}
        </button>
      </form>
    </div>
  );
}
