import OpenAI from "openai";

// ─── OpenAI client ────────────────────────────────────────────────────────────

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey:  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "placeholder",
});

// ─── Engineering terminology dictionary ───────────────────────────────────────
// These overrides are applied AFTER the AI translation to guarantee correctness.

const EN_TO_AR_DICT: [RegExp, string][] = [
  [/\bPCB\b/gi,                    "لوحة الدوائر المطبوعة"],
  [/\bEmbedded Systems?\b/gi,      "الأنظمة المدمجة"],
  [/\bEmbedded\b/gi,               "المدمج"],
  [/\bCircuits?\b/gi,              "دائرة إلكترونية"],
  [/\bHardware\b/gi,               "الأجهزة الإلكترونية"],
  [/\bFirmware\b/gi,               "البرمجيات الثابتة"],
  [/\bBare-metal\b/gi,             "برمجة منخفضة المستوى"],
  [/\bSignal [Ii]ntegrity\b/gi,    "سلامة الإشارة"],
  [/\bMicrocontroller\b/gi,        "المتحكم الدقيق"],
  [/\bMicroprocessor\b/gi,         "المعالج الدقيق"],
  [/\bRTOS\b/gi,                   "نظام التشغيل الفوري"],
  [/\bReal-[Tt]ime\b/gi,           "الوقت الفعلي"],
  [/\bSchematic\b/gi,              "المخطط الكهربائي"],
  [/\bGerber\b/gi,                 "ملفات جيربر"],
  [/\bBOM\b/gi,                    "قائمة المواد"],
  [/\bSMD\b/gi,                    "المكوّنات السطحية"],
  [/\bSMT\b/gi,                    "تقنية التركيب السطحي"],
  [/\bI2C\b/gi,                    "بروتوكول I2C"],
  [/\bSPI\b/gi,                    "بروتوكول SPI"],
  [/\bUART\b/gi,                   "بروتوكول UART"],
  [/\bCAN [Bb]us\b/gi,             "ناقل CAN"],
  [/\bEMI\b/gi,                    "التداخل الكهرومغناطيسي"],
  [/\bEMC\b/gi,                    "التوافق الكهرومغناطيسي"],
  [/\bARM Cortex\b/gi,             "معالج ARM Cortex"],
  [/\bARM\b/gi,                    "معالج ARM"],
  [/\bFPGA\b/gi,                   "البوابة المنطقية القابلة للبرمجة"],
  [/\bRobotics?\b/gi,              "الروبوتات"],
  [/\bAutomation\b/gi,             "الأتمتة"],
  [/\bPower [Ee]lectronics\b/gi,   "إلكترونيات الطاقة"],
  [/\bMotor [Cc]ontrol\b/gi,       "التحكم بالمحرك"],
  [/\bSensor\b/gi,                 "المستشعر"],
  [/\bActuator\b/gi,               "المشغّل"],
  [/\bProtocol\b/gi,               "البروتوكول"],
  [/\bMicrochip\b/gi,              "الرقاقة الإلكترونية"],
  [/\bLayout\b/gi,                 "تصميم اللوحة"],
  [/\bRouting\b/gi,                "توجيه الأسلاك"],
  [/\bTrace\b/gi,                  "مسار موصّل"],
  [/\bVias?\b/gi,                  "ثقوب التوصيل"],
  [/\bGroundPlane\b/gi,            "طبقة الأرضي"],
  [/\bPower [Pp]lane\b/gi,         "طبقة الطاقة"],
  [/\bDebug(?:ging)?\b/gi,         "التنقيح"],
  [/\bFlash(?:ing)?\b/gi,          "البرمجة"],
  [/\bBootloader\b/gi,             "محمّل الإقلاع"],
  [/\bDriver\b/gi,                 "مشغّل"],
  [/\bMiddleware\b/gi,             "البرامج الوسيطة"],
  [/\bAPI\b/g,                     "واجهة برمجة التطبيقات"],
  [/\bOSCE\b/gi,                   "دائرة المذبذب"],
  [/\bPWM\b/gi,                    "تعديل عرض النبضة"],
  [/\bADC\b/gi,                    "المحوّل التناظري الرقمي"],
  [/\bDAC\b/gi,                    "المحوّل الرقمي التناظري"],
  [/\bGPIO\b/gi,                   "منافذ الإدخال والإخراج"],
  [/\bDMA\b/gi,                    "الوصول المباشر للذاكرة"],
  [/\bStack\b/gi,                  "المكدّس"],
  [/\bHeap\b/gi,                   "منطقة الكومة"],
  [/\bISR\b/gi,                    "روتين خدمة المقاطعة"],
  [/\bInterrupt\b/gi,              "مقاطعة"],
  [/\bWatchdog\b/gi,               "مؤقت المراقبة"],
  [/\bCE [Cc]ompliant\b/gi,        "متوافق مع معيار CE"],
  [/\bIoT\b/gi,                    "إنترنت الأشياء"],
  [/\bPrototype\b/gi,              "نموذج أولي"],
];

const AR_TO_EN_DICT: [RegExp, string][] = [
  [/لوحة الدوائر المطبوعة/g, "PCB"],
  [/الأنظمة المدمجة/g,        "Embedded Systems"],
  [/البرمجيات الثابتة/g,      "Firmware"],
  [/الأجهزة الإلكترونية/g,   "Hardware"],
  [/دائرة إلكترونية/g,        "Electronic Circuit"],
  [/المتحكم الدقيق/g,         "Microcontroller"],
  [/نظام التشغيل الفوري/g,    "RTOS"],
  [/المخطط الكهربائي/g,       "Schematic"],
  [/التداخل الكهرومغناطيسي/g, "EMI"],
  [/التوافق الكهرومغناطيسي/g, "EMC"],
  [/إنترنت الأشياء/g,          "IoT"],
  [/نموذج أولي/g,              "Prototype"],
];

// ─── In-process LRU cache ─────────────────────────────────────────────────────

const MAX_CACHE = 2000;
const cache = new Map<string, string>();

function cacheGet(key: string): string | undefined {
  return cache.get(key);
}

function cacheSet(key: string, value: string): void {
  if (cache.size >= MAX_CACHE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, value);
}

function cacheKey(text: string, from: string, to: string): string {
  return `${from}→${to}:${text}`;
}

// ─── Dictionary application ───────────────────────────────────────────────────

function applyDictionary(text: string, from: "en" | "ar", to: "en" | "ar"): string {
  if (from === "en" && to === "ar") {
    return EN_TO_AR_DICT.reduce(
      (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
      text,
    );
  }
  if (from === "ar" && to === "en") {
    return AR_TO_EN_DICT.reduce(
      (acc, [pattern, replacement]) => acc.replace(pattern, replacement),
      text,
    );
  }
  return text;
}

// ─── MyMemory fallback ────────────────────────────────────────────────────────

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

function splitChunks(text: string, maxLen = 490): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let end = maxLen;
    if (remaining.length > maxLen) {
      const sentenceEnd = remaining.lastIndexOf(". ", maxLen);
      if (sentenceEnd > maxLen / 2) end = sentenceEnd + 2;
    }
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  return chunks;
}

async function myMemoryTranslate(text: string, from: "en" | "ar", to: "en" | "ar"): Promise<string> {
  try {
    const chunks = splitChunks(text);
    const parts = await Promise.all(
      chunks.map(async (chunk) => {
        const url = `${MYMEMORY_URL}?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`;
        const resp = await fetch(url, {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "InfinityTech/1.0" },
        });
        if (!resp.ok) return chunk;
        const data = (await resp.json()) as any;
        const translated = data?.responseData?.translatedText;
        return typeof translated === "string" && translated.trim() ? translated : chunk;
      }),
    );
    return parts.join(" ");
  } catch {
    return text;
  }
}

// ─── AI translation (Layer 1 + Layer 2) ──────────────────────────────────────

const SYSTEM_PROMPT_EN_TO_AR = `You are a professional technical translator specialising in hardware engineering, embedded systems, and electronics.

Translate English text to Arabic. Follow these rules strictly:
1. Use professional engineering terminology throughout.
2. Produce natural, fluent Arabic — not a word-for-word literal translation.
3. Maintain the author's confident, professional tone.
4. Do not translate proper nouns, brand names, acronyms (PCB, RTOS, I2C, SPI, UART, ARM, FPGA, PWM, ADC, DAC, GPIO, DMA, BOM, SMD, SMT, EMI, EMC, IoT, CAN, ISR), or model numbers — keep them as-is in Latin script.
5. Engineering terms to use when applicable:
   - Firmware → البرمجيات الثابتة
   - Bare-metal → برمجة منخفضة المستوى
   - Signal Integrity → سلامة الإشارة
   - Embedded Systems → الأنظمة المدمجة
   - Microcontroller → المتحكم الدقيق
   - Schematic → المخطط الكهربائي
   - Hardware → الأجهزة الإلكترونية
   - Circuit → دائرة إلكترونية
   - Real-time → الوقت الفعلي
   - Prototype → نموذج أولي
6. Output ONLY the translated Arabic text, with no explanation, notes, or original text.`;

const SYSTEM_PROMPT_AR_TO_EN = `You are a professional technical translator specialising in hardware engineering, embedded systems, and electronics.

Translate Arabic text to English. Follow these rules strictly:
1. Use standard technical English engineering terminology.
2. Produce natural, professional English — not a literal translation.
3. Keep acronyms (PCB, RTOS, I2C, SPI, UART, ARM, FPGA, EMI, EMC, IoT, BOM) in their standard English form.
4. Output ONLY the translated English text, with no explanation or notes.`;

async function aiTranslate(text: string, from: "en" | "ar", to: "en" | "ar"): Promise<string> {
  const systemPrompt = from === "en" ? SYSTEM_PROMPT_EN_TO_AR : SYSTEM_PROMPT_AR_TO_EN;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: text },
    ],
  });

  const result = response.choices[0]?.message?.content?.trim();
  if (!result) throw new Error("Empty AI translation response");
  return result;
}

// ─── Public translate function ────────────────────────────────────────────────

export async function translate(
  text: string,
  from: "en" | "ar",
  to: "en" | "ar",
): Promise<string> {
  if (!text?.trim()) return text;

  const key = cacheKey(text, from, to);
  const cached = cacheGet(key);
  if (cached) return cached;

  let result: string;

  try {
    // Layer 1: AI translation — the system prompt already enforces correct terminology,
    // so no dictionary post-processing is needed (it would cause duplicates).
    result = await aiTranslate(text, from, to);
  } catch (err) {
    // Graceful fallback to MyMemory — apply dictionary override to fix basic MT errors
    console.warn("[translate] AI failed, falling back to MyMemory:", (err as Error).message);
    const raw = await myMemoryTranslate(text, from, to);
    result = applyDictionary(raw, from, to);
  }

  cacheSet(key, result);
  return result;
}

// ─── Field-level auto-translation ────────────────────────────────────────────

type LangFields = {
  title_en?: string;
  title_ar?: string;
  description_en?: string;
  description_ar?: string;
  overview_en?: string;
  overview_ar?: string;
  problem_en?: string;
  problem_ar?: string;
  solution_en?: string;
  solution_ar?: string;
};

const FIELD_PAIRS: Array<[keyof LangFields, keyof LangFields]> = [
  ["title_en",       "title_ar"],
  ["description_en", "description_ar"],
  ["overview_en",    "overview_ar"],
  ["problem_en",     "problem_ar"],
  ["solution_en",    "solution_ar"],
];

export async function autoTranslateFields(body: LangFields): Promise<LangFields> {
  const jobs = FIELD_PAIRS.map(async ([enKey, arKey]) => {
    const enVal = body[enKey] as string | undefined;
    const arVal = body[arKey] as string | undefined;

    if (enVal && !arVal) {
      body[arKey] = await translate(enVal, "en", "ar");
    } else if (arVal && !enVal) {
      body[enKey] = await translate(arVal, "ar", "en");
    }
    // If both are present (manual override) → leave them untouched
  });

  await Promise.all(jobs);
  return body;
}

// ─── Cache invalidation helper (for testing / admin use) ─────────────────────

export function clearTranslationCache(): void {
  cache.clear();
}

export function getTranslationCacheSize(): number {
  return cache.size;
}
