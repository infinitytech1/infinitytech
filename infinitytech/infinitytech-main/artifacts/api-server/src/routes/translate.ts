import { Router } from "express";

const router = Router();

// ── Language detection ────────────────────────────────────────────────────────
function detectLang(text: string): "ar" | "en" {
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return arabicChars / Math.max(text.replace(/\s/g, "").length, 1) > 0.2 ? "ar" : "en";
}

// ── Post-processing: restore any mangled preserve terms ──────────────────────
// Helsinki-NLP models preserve uppercase Latin acronyms naturally.
// As a safety net we run a simple correction pass after translation.
const PRESERVE_TERMS: [RegExp, string][] = [
  [/\bedge[\s-]?ai\b/gi,    "Edge AI"],
  [/\bbom\b/gi,             "BOM"],
  [/\bplc\b/gi,             "PLC"],
  [/\bpcb\b/gi,             "PCB"],
  [/\bmcu\b/gi,             "MCU"],
  [/\bfpga\b/gi,            "FPGA"],
  [/\brtos\b/gi,            "RTOS"],
  [/\bcad\b/gi,             "CAD"],
  [/\bcam\b/gi,             "CAM"],
  [/\bcnc\b/gi,             "CNC"],
  [/\bstm32\b/gi,           "STM32"],
  [/\besp32\b/gi,           "ESP32"],
  [/\bros\b/gi,             "ROS"],
  [/\blidar\b/gi,           "LiDAR"],
  [/\bimu\b/gi,             "IMU"],
  [/\bgpio\b/gi,            "GPIO"],
  [/\badc\b/gi,             "ADC"],
  [/\bdac\b/gi,             "DAC"],
  [/\bfft\b/gi,             "FFT"],
  [/\bgripper\b/gi,         "Gripper"],
  [/\barduino\b/gi,         "Arduino"],
];

function postCorrect(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PRESERVE_TERMS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ── Provider: Hugging Face — Helsinki-NLP neural translation models ───────────
// These are purpose-built translation models (faster, cheaper, and more accurate
// for technical text than instruction-tuned LLMs). They preserve acronyms naturally.
async function translateHuggingFace(
  text: string,
  from: string,
  to: string,
  hfToken: string,
): Promise<string> {
  // Choose the correct directional model
  const model = from === "ar" && to === "en"
    ? "Helsinki-NLP/opus-mt-ar-en"
    : from === "en" && to === "ar"
    ? "Helsinki-NLP/opus-mt-en-ar"
    : null;

  if (!model) throw new Error(`No HF model available for ${from}→${to}`);

  const res = await fetch(
    `https://router.huggingface.co/hf-inference/models/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: text }),
      signal: AbortSignal.timeout(30_000),
    },
  );

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`HuggingFace HTTP ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json() as any;
  const raw: string =
    data?.[0]?.translation_text ??
    (typeof data === "string" ? data : null);

  if (!raw) throw new Error("Empty response from HuggingFace");
  return postCorrect(raw);
}

// ── Provider: MyMemory (free fallback, no key) ────────────────────────────────
async function translateMyMemory(text: string, from: string, to: string): Promise<string> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);
  const data = await res.json() as any;
  if (data.responseStatus !== 200) throw new Error(data.responseDetails || "MyMemory error");
  return data.responseData.translatedText;
}

// ── Provider: Google Translate v2 ────────────────────────────────────────────
async function translateGoogle(text: string, from: string, to: string, apiKey: string): Promise<string> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source: from, target: to, format: "text" }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error?.message || "Google Translate error");
  return data.data?.translations?.[0]?.translatedText
    ?? (() => { throw new Error("Empty Google response"); })();
}

// ── Provider: DeepL ───────────────────────────────────────────────────────────
async function translateDeepL(text: string, from: string, to: string, apiKey: string): Promise<string> {
  const base = apiKey.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  const res = await fetch(`${base}/v2/translate`, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      source_lang: from.toUpperCase(),
      target_lang: to === "ar" ? "AR" : "EN-US",
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.message || "DeepL error");
  return data.translations?.[0]?.text
    ?? (() => { throw new Error("Empty DeepL response"); })();
}

// ── POST /api/translate ───────────────────────────────────────────────────────
router.post("/translate", async (req, res) => {
  try {
    const { text, from, to } = req.body as { text?: string; from?: string; to?: string };

    if (!text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "text is required" });
    }
    if (!from || !to) {
      return res.status(400).json({ error: "from and to language codes are required" });
    }
    if (from === to) {
      return res.json({ translatedText: text, provider: "none", detected: from });
    }

    const sourceLang = from === "auto" ? detectLang(text) : from;
    const hfToken    = process.env.HF_TOKEN;
    const googleKey  = process.env.GOOGLE_TRANSLATE_API_KEY;
    const deeplKey   = process.env.DEEPL_API_KEY;

    let translatedText: string;
    let provider: string;

    // Priority: HuggingFace Helsinki opus → Google → DeepL → MyMemory
    if (hfToken) {
      console.log(`[translate] Using HuggingFace Helsinki opus (${sourceLang}→${to})`);
      translatedText = await translateHuggingFace(text, sourceLang, to, hfToken);
      provider = "opus-mt";
    } else if (googleKey) {
      translatedText = await translateGoogle(text, sourceLang, to, googleKey);
      provider = "google";
    } else if (deeplKey) {
      translatedText = await translateDeepL(text, sourceLang, to, deeplKey);
      provider = "deepl";
    } else {
      console.warn("[translate] No AI key — falling back to MyMemory");
      translatedText = await translateMyMemory(text, sourceLang, to);
      provider = "mymemory";
    }

    console.log(`[translate] ✓ ${provider}: ${text.length} chars → ${translatedText.length} chars`);
    return res.json({ translatedText, provider, detected: sourceLang });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Translation failed";
    console.error("[translate] ✗ Error:", message);
    return res.status(500).json({ error: message });
  }
});

// ── POST /api/detect-language ─────────────────────────────────────────────────
router.post("/detect-language", (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "text is required" });
  }
  return res.json({ language: detectLang(text) });
});

export default router;
