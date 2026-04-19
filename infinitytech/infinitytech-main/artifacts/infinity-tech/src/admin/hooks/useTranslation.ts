import { useState, useCallback, useRef } from "react";

const MEM_CACHE = new Map<string, string>();
const STORAGE_KEY = "it-translate-cache";

function loadCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const entries: [string, string][] = JSON.parse(raw);
      entries.forEach(([k, v]) => MEM_CACHE.set(k, v));
    }
  } catch {}
}

function saveCache(key: string, value: string) {
  MEM_CACHE.set(key, value);
  try {
    const entries = Array.from(MEM_CACHE.entries()).slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

loadCache();

export function detectLang(text: string): "ar" | "en" {
  const stripped = text.replace(/\s/g, "");
  if (!stripped.length) return "en";
  const arabicChars = (stripped.match(/[\u0600-\u06FF]/g) || []).length;
  return arabicChars / stripped.length > 0.2 ? "ar" : "en";
}

export interface TranslationResult {
  translatedText: string;
  provider: string;
  cached: boolean;
}

export function useTranslation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const translate = useCallback(async (
    text: string,
    from: string,
    to: string
  ): Promise<TranslationResult | null> => {
    if (!text.trim()) return null;
    if (from === to) return { translatedText: text, provider: "none", cached: false };

    const cacheKey = `${from}:${to}:${text.trim()}`;

    if (MEM_CACHE.has(cacheKey)) {
      return { translatedText: MEM_CACHE.get(cacheKey)!, provider: "cache", cached: true };
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), from, to }),
        signal: abortRef.current.signal,
      });

      const data = await res.json() as { translatedText?: string; provider?: string; error?: string };

      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (!data.translatedText) throw new Error("Empty translation response");

      saveCache(cacheKey, data.translatedText);
      return { translatedText: data.translatedText, provider: data.provider || "unknown", cached: false };
    } catch (err) {
      if ((err as Error).name === "AbortError") return null;
      const msg = err instanceof Error ? err.message : "Translation failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { translate, loading, error, clearError, detectLang };
}
