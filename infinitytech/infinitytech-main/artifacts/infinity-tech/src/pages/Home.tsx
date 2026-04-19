import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, ChevronRight, CircuitBoard, Cpu, Layers, Mail, Zap } from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { SEO, SITE_JSONLD, PERSON_JSONLD } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

/* ─── constants ─────────────────────────────────────────── */

const CODE_SNIPPET = `// PCB system init — CISPR 32B compliant
#define IMU_RATE_HZ   8000
#define SW_FREQ_KHZ    500
#define PCB_LAYERS       6

void board_init(void) {
  pwm_set_freq(SW_FREQ_KHZ);
  imu_set_rate(IMU_RATE_HZ);
  emi_filter_enable(CISPR_32B);
}`;

const CHAR_BASE      = 55;
const CHAR_VARIANCE  = 0.4;
const PUNCT_PAUSE    = 180;
const NEWLINE_PAUSE  = 320;

/* ─── code typewriter ────────────────────────────────────── */

function useCodeTypewriter(text: string, startDelay = 900) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick() {
      const i = idxRef.current;
      if (i >= text.length) { setDone(true); return; }
      const ch = text[i];
      idxRef.current = i + 1;
      setDisplayed(text.slice(0, i + 1));
      let delay = CHAR_BASE * 0.6 * (1 + (Math.random() * 2 - 1) * CHAR_VARIANCE);
      if (ch === "\n") delay += NEWLINE_PAUSE;
      else if (".,:;{}()".includes(ch)) delay += PUNCT_PAUSE * 0.5;
      timer = setTimeout(tick, delay);
    }
    timer = setTimeout(tick, startDelay);
    return () => clearTimeout(timer);
  }, [text, startDelay]);

  return { displayed, done };
}

/* ─── blinking cursor ────────────────────────────────────── */

function Cursor({ slow = false }: { slow?: boolean }) {
  const [on, setOn] = useState(true);
  const interval = slow ? 850 : 530;
  useEffect(() => {
    const t = setInterval(() => setOn(v => !v), interval);
    return () => clearInterval(t);
  }, [interval]);
  return (
    <span
      className="inline-block w-[2px] h-[0.82em] bg-primary align-middle ml-[2px] rounded-[1px]"
      style={{ opacity: on ? 1 : 0, transition: slow ? "opacity 0.18s" : "opacity 0.08s" }}
    />
  );
}

/* ─── stacked typewriter ─────────────────────────────────── */

/*
 * Three words typed sequentially, stacked vertically.
 * Design → Precision → Performance — a logical engineering progression.
 *
 * Rules:
 *   • Types each word letter-by-letter, then pauses before the next
 *   • STOPS after all three words — no loop, no delete
 *   • Cursor shows only on the active line; disappears when done
 *   • All three line slots are pre-allocated so layout never shifts
 */
const STACK_WORDS = ["Design", "Precision", "Performance"] as const;
type StackWord = (typeof STACK_WORDS)[number];

function useStackedTypewriter() {
  // Target: 80–120 ms/char, ±15 ms natural variation
  const CHAR_BASE  = 95;  // ms — midpoint of 80–120 ms range
  const CHAR_VAR   = 15;  // ±ms jitter per character
  const WORD_PAUSE = 650; // ms between words (500–800 ms feel)

  const [lines, setLines] = useState<Record<StackWord, string>>({
    Design: "", Precision: "", Performance: "",
  });
  const [active, setActive] = useState(0); // index into STACK_WORDS
  const [done,   setDone]   = useState(false);
  const charRef  = useRef(0); // character index within the active word

  useEffect(() => {
    if (done) return;

    charRef.current = 0;
    const word = STACK_WORDS[active];

    let timer: ReturnType<typeof setTimeout>;

    function typeNext() {
      const ci = charRef.current;
      if (ci >= word.length) {
        // Word fully typed — natural pause then advance
        if (active < STACK_WORDS.length - 1) {
          timer = setTimeout(() => setActive(a => a + 1), WORD_PAUSE);
        } else {
          setDone(true);
        }
        return;
      }
      charRef.current = ci + 1;
      setLines(prev => ({ ...prev, [word]: word.slice(0, ci + 1) }));

      // Base delay with gentle ±15 ms variation
      let delay = CHAR_BASE + (Math.random() * CHAR_VAR * 2 - CHAR_VAR);

      // Slightly slower at the very start of each word — like gathering thought
      if (ci === 0) delay += 75;

      // Subtle hesitation just before the final character of each word
      if (ci === word.length - 2) delay += 35;

      timer = setTimeout(typeNext, delay);
    }

    // First word waits for page to settle; subsequent words start immediately
    timer = setTimeout(typeNext, active === 0 ? 500 : 0);
    return () => clearTimeout(timer);
  }, [active, done]);

  return { lines, active, done };
}

/*
 * Arabic static headline — mirrors StackedHeadline visually but uses static
 * text since cursive-connected Arabic glyphs look broken mid-typewriter.
 * Last word gets the primary cyan + glow treatment identical to the EN version.
 */
const ARABIC_WORDS = [
  { text: "التصميم",  accent: false },
  { text: "الدقة",    accent: false },
  { text: "الأداء",   accent: true  },
] as const;

function ArabicHeadline({ align = "right" }: { align?: "right" | "center" }) {
  const fs = align === "center"
    ? "clamp(2.2rem, 9vw, 3.2rem)"
    : "clamp(2.8rem, 4.6vw, 4.4rem)";

  return (
    <div style={{ display: "inline-block", textAlign: align }}>
      {ARABIC_WORDS.map(({ text, accent }) => (
        <div key={text} style={{ lineHeight: "1.12", marginBottom: "0.04em" }}>
          <span
            className="font-black tracking-tight block"
            style={{
              fontSize: fs,
              fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif",
              letterSpacing: "0.01em",
              color: accent ? "hsl(var(--primary))" : "hsl(var(--foreground))",
              textShadow: accent ? "0 0 40px rgba(34,211,238,0.45)" : undefined,
            }}
          >
            {text}
          </span>
        </div>
      ))}
    </div>
  );
}

/*
 * Shared headline component — used by both mobile and desktop layouts.
 * Each word line is pre-allocated via an invisible full-word anchor span,
 * so the container dimensions never change during typing.
 */
function StackedHeadline({ align = "left" }: { align?: "left" | "center" }) {
  const { lines, active, done } = useStackedTypewriter();

  /* Font size differs only between mobile (passed via align="center") and desktop */
  const fs = align === "center"
    ? "clamp(2.2rem, 9vw, 3.2rem)"
    : "clamp(2.8rem, 4.6vw, 4.4rem)";

  return (
    <div style={{ display: "inline-block", textAlign: align }}>
      {STACK_WORDS.map((word, i) => {
        const display  = lines[word];
        const isActive = active === i && !done;
        /* Last word ("Performance") gets the primary cyan + glow */
        const isAccent = i === STACK_WORDS.length - 1;

        return (
          <div key={word} className="relative" style={{ lineHeight: "1.12", marginBottom: "0.04em" }}>
            {/*
             * Invisible anchor — always occupies the full word's width and height.
             * This pre-allocates the exact space before a single character is typed,
             * preventing any layout shift throughout the animation.
             */}
            <span
              aria-hidden
              className="invisible font-black tracking-tighter block"
              style={{ fontSize: fs }}
            >
              {word}
            </span>

            {/* Typed overlay — absolutely positioned on top of the anchor */}
            <span
              className="absolute inset-0 flex items-center font-black tracking-tighter"
              style={{
                fontSize: fs,
                color: isAccent ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                textShadow: isAccent && display.length > 0
                  ? "0 0 40px rgba(34,211,238,0.45)"
                  : undefined,
              }}
            >
              {display}
              {isActive && <Cursor />}
              {done && i === STACK_WORDS.length - 1 && (
                <motion.span
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ delay: 2.5, duration: 2, ease: "easeOut" }}
                  style={{ display: "inline" }}
                >
                  <Cursor slow />
                </motion.span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── metrics ────────────────────────────────────────────── */

const METRICS = [
  { icon: Layers,       label: "PCB Layers",   value: "Up to 6",      accent: false },
  { icon: Cpu,          label: "Processor",    value: "ARM Cortex-M", accent: false },
  { icon: Zap,          label: "Sensor Speed", value: "8,000 / sec",  accent: true  },
  { icon: CircuitBoard, label: "Field Ready",  value: "CE Compliant", accent: false },
];

/* ─── framer variants ────────────────────────────────────── */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

/* ─── component ──────────────────────────────────────────── */

export function Home() {
  const { data: projects, isLoading } = useProjects();
  const featuredProjects = projects?.slice(0, 3) || [];
  const { displayed: codeDisplayed, done: codeDone } = useCodeTypewriter(CODE_SNIPPET, 600);
  const { t, isRTL } = useLanguage();

  return (
    <div className="w-full flex flex-col min-h-screen">
      <SEO
        title="Fares Salah — Hardware Engineer & PCB Design"
        description="Hardware engineer specializing in multi-layer PCB design, bare-metal firmware, and production-ready embedded systems — from schematic to silicon."
        keywords="hardware engineer, PCB design, embedded systems, firmware, STM32, FPGA, KiCad, Altium, robotics, ROS2"
        jsonLd={[SITE_JSONLD, PERSON_JSONLD]}
      />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section
        dir={isRTL ? "rtl" : "ltr"}
        className="relative w-full lg:h-[100dvh] overflow-hidden flex flex-col"
      >

        {/* Background glow */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,238,0.055) 0%, transparent 68%)",
          }}
        />

        {/* Navbar clearance */}
        <div className="flex-none h-16" />

        {/* ── MOBILE layout (< lg): natural flow ── */}
        <div
          className="lg:hidden flex flex-col px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16 relative z-10"
          style={{
            alignItems: isRTL ? "flex-end" : "center",
            textAlign: isRTL ? "right" : "center",
          }}
        >

          {/* Badge */}
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border backdrop-blur-[8px] mb-4"
            style={{ alignSelf: isRTL ? "flex-end" : "center" }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span
              className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]"
              style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}
            >
              {isRTL ? "هندسة الأجهزة وتصميم PCB" : "Hardware Eng & PCB Design"}
            </span>
          </motion.div>

          {/* Stacked headline — mobile */}
          <h1
            className="mb-6 select-none"
            style={{ textAlign: isRTL ? "right" : "center" }}
            aria-label={isRTL ? "التصميم · الدقة · الأداء" : "Design · Precision · Performance"}
          >
            {isRTL
              ? <ArabicHeadline align="center" />
              : <StackedHeadline align="center" />
            }
          </h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.38)}
            className="text-sm sm:text-[15px] text-muted-foreground leading-[1.75] mb-7 max-w-lg"
            style={{
              textAlign: isRTL ? "right" : "center",
              fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined,
            }}
          >
            {t(
              <>
                Hardware engineer specializing in{" "}
                <span className="text-foreground/90 font-medium">multi-layer PCB design</span>,{" "}
                <span className="text-foreground/90 font-medium">bare-metal firmware</span>, and
                production-ready{" "}
                <span className="text-foreground/90 font-medium">embedded systems</span>{" "}
                <span className="text-primary/80">—</span>{" "}
                from schematic to silicon.
              </>,
              <>
                مهندس إلكترونيات متخصص في{" "}
                <span className="text-foreground/90 font-medium">تصميم لوحات PCB متعددة الطبقات</span>،{" "}
                <span className="text-foreground/90 font-medium">البرمجة المدمجة على المستوى المعدني</span>،{" "}
                وأنظمة{" "}
                <span className="text-foreground/90 font-medium">مدمجة جاهزة للإنتاج</span>{" "}
                <span className="text-primary/80">—</span>{" "}
                من المخطط الكهربائي إلى الرقاقة الإلكترونية.
              </>
            )}
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.44)}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto"
            style={{ flexDirection: isRTL ? "row-reverse" : undefined } as React.CSSProperties}
          >
            <Link
              href="/projects"
              className="px-7 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors duration-200 text-[15px]"
              style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}
            >
              {t("View Projects", "استعرض المشاريع")}
              <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ transform: isRTL ? "scaleX(-1)" : "none" }} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-white/5 transition-colors duration-200 text-[15px]"
              style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}
            >
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              {t("Contact", "تواصل معي")}
            </Link>
          </motion.div>

        </div>

        {/* ── DESKTOP layout (lg+): grid + pinned stats ── */}
        <div className="hidden lg:flex flex-1 items-center px-6 lg:px-8 relative z-10 min-h-0">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-12 gap-10 xl:gap-14 items-center">

              {/* Text column — order 1 in EN (left), order 2 in AR (right) */}
              <div
                className="col-span-7 flex flex-col"
                style={{
                  alignItems: isRTL ? "flex-end" : "flex-start",
                  order: isRTL ? 2 : 1,
                }}
              >
                <motion.div
                  {...fadeUp(0)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 border border-border backdrop-blur-[8px] mb-4"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span
                    className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.18em]"
                    style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}
                  >
                    {isRTL ? "هندسة الأجهزة وتصميم PCB" : "Hardware Eng & PCB Design"}
                  </span>
                </motion.div>

                {/* Headline — Arabic static or English typewriter */}
                <h1
                  className="mb-6 select-none"
                  aria-label={isRTL ? "التصميم · الدقة · الأداء" : "Design · Precision · Performance"}
                >
                  {isRTL
                    ? <ArabicHeadline align="right" />
                    : <StackedHeadline align="left" />
                  }
                </h1>

                <motion.p
                  {...fadeUp(0.38)}
                  className="text-[15px] md:text-base text-muted-foreground leading-[1.75] mb-6 max-w-xl"
                  style={{
                    textAlign: isRTL ? "right" : "left",
                    fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined,
                  }}
                >
                  {t(
                    <>
                      Hardware engineer specializing in{" "}
                      <span className="text-foreground/90 font-medium">multi-layer PCB design</span>,{" "}
                      <span className="text-foreground/90 font-medium">bare-metal firmware</span>, and
                      production-ready{" "}
                      <span className="text-foreground/90 font-medium">embedded systems</span>{" "}
                      <span className="text-primary/80">—</span>{" "}
                      from schematic to silicon.
                    </>,
                    <>
                      مهندس إلكترونيات متخصص في{" "}
                      <span className="text-foreground/90 font-medium">تصميم لوحات PCB متعددة الطبقات</span>،{" "}
                      <span className="text-foreground/90 font-medium">البرمجة المدمجة على المستوى المعدني</span>،{" "}
                      وأنظمة{" "}
                      <span className="text-foreground/90 font-medium">مدمجة جاهزة للإنتاج</span>{" "}
                      <span className="text-primary/80">—</span>{" "}
                      من المخطط الكهربائي إلى الرقاقة الإلكترونية.
                    </>
                  )}
                </motion.p>

                <motion.div
                  {...fadeUp(0.48)}
                  className="flex items-center gap-4"
                  style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
                >
                  <Link
                    href="/projects"
                    className="px-7 py-3 bg-primary text-primary-foreground font-semibold rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors duration-200 text-[15px]"
                    style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}
                  >
                    {t("View Projects", "استعرض المشاريع")}
                    <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ transform: isRTL ? "scaleX(-1)" : "none" }} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-7 py-3 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-white/5 transition-colors duration-200 text-[15px]"
                    style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}
                  >
                    <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                    {t("Contact", "تواصل معي")}
                  </Link>
                </motion.div>
              </div>

              {/* Code card — order 2 in EN (right), order 1 in AR (left) */}
              <div className="col-span-5 flex" style={{ order: isRTL ? 1 : 2 }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="w-full rounded-xl bg-card overflow-hidden group/card"
                  style={{
                    border: "1px solid rgba(34,211,238,0.12)",
                    boxShadow: "0 0 0 1px rgba(34,211,238,0.04), 0 8px 32px rgba(0,0,0,0.4)",
                    transition: "border-color 0.3s ease, box-shadow 0.3s ease",
                  }}
                  whileHover={{
                    boxShadow: "0 0 0 1px rgba(34,211,238,0.2), 0 0 40px rgba(34,211,238,0.08), 0 8px 32px rgba(0,0,0,0.5)",
                  }}
                >
                  <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)" }} />
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0D1117]">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">system · live</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-white/10" />
                      <div className="w-2 h-2 rounded-full bg-primary/30" />
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {METRICS.map(({ icon: Icon, label, value, accent }, i) => (
                        <div
                          key={label}
                          className="metric-shimmer flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-background border border-white/5 hover:border-primary/25 hover:bg-primary/5 transition-colors duration-200 cursor-default"
                          style={{ animationDelay: `${i * 0.9}s` }}
                        >
                          <div className="w-7 h-7 flex-shrink-0 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center group-hover/card:bg-primary/12 transition-colors duration-300">
                            <Icon className="w-3.5 h-3.5 text-primary/80" />
                          </div>
                          <div className="min-w-0 flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60 leading-none mb-0.5">{label}</span>
                            <span className={`text-[13px] font-mono font-semibold leading-none truncate ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-white/5 bg-[#0D1117] overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-white/10" />
                          <div className="w-2 h-2 rounded-full bg-white/10" />
                          <div className="w-2 h-2 rounded-full bg-primary/20" />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground/50">inference.c</span>
                        <span className="text-[9px] font-mono text-primary/50 uppercase tracking-widest">● ready</span>
                      </div>
                      <div className="relative px-3 py-3">
                        <pre aria-hidden className="invisible text-[10.5px] font-mono leading-[1.65] whitespace-pre">
                          <code>{CODE_SNIPPET}</code>
                        </pre>
                        <pre className="absolute inset-0 px-3 py-3 text-[10.5px] font-mono leading-[1.65] whitespace-pre overflow-x-hidden">
                          <code className="text-[#A8B5C8]">
                            {codeDisplayed.split("\n").map((line, li, arr) => {
                              const isComment    = line.trimStart().startsWith("//");
                              const isPreproc    = line.trimStart().startsWith("#");
                              return (
                                <span key={li} className="block">
                                  {isComment
                                    ? <span className="text-[#4D6880]">{line}</span>
                                    : isPreproc
                                    ? <span className="text-[#4D6880]">{line}</span>
                                    : line.split(/(\b(?:void|pwm_set_freq|imu_set_rate|emi_filter_enable|IMU_RATE_HZ|SW_FREQ_KHZ|PCB_LAYERS|CISPR_32B)\b)/).map((seg, si) =>
                                        /^(void)$/.test(seg)
                                          ? <span key={si} className="text-primary/80">{seg}</span>
                                          : /^(pwm_set_freq|imu_set_rate|emi_filter_enable|IMU_RATE_HZ|SW_FREQ_KHZ|PCB_LAYERS|CISPR_32B)$/.test(seg)
                                          ? <span key={si} className="text-[#79C0FF]">{seg}</span>
                                          : <span key={si}>{seg}</span>
                                      )
                                  }
                                  {li === arr.length - 1 && !codeDone && <Cursor />}
                                </span>
                              );
                            })}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </div>

      </section>

      <div className="section-divider" />

      {/* ── Expertise ─────────────────────────────────────── */}
      <section className="section-y relative z-10 bg-background/50 cv-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 sm:mb-12">
            <p className="text-[11px] font-semibold text-primary uppercase mb-3">
              {t("Core Disciplines", "التخصصات الأساسية")}
            </p>
            <h2 className="fluid-h2 font-bold tracking-tighter text-foreground">
              {t("What I Build", "ما أبنيه")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Layers,
                badge: "Up to 6L",
                title:    "PCB Layout & Signal Integrity",
                titleAr:  "تصميم PCB وسلامة الإشارة",
                desc:     "Multi-layer stack-up design with controlled-impedance routing for high-speed differential pairs, CAN bus transceivers, and dense power rails. Every layer assignment optimized for signal return paths, thermal relief, and DFM-ready production output.",
                descAr:   "تصميم تركيبة متعددة الطبقات مع توجيه محكوم الإشارة للأزواج التفاضلية عالية السرعة، ومحولات ناقل CAN، ومسارات الطاقة المكثّفة. كل طبقة محسَّنة لضمان مسارات العودة الكهربائية والتبديد الحراري ومخرجات جاهزة للتصنيع.",
                tags: ["KiCad", "Altium Designer", "Impedance Control", "CISPR 32B", "DFM"],
              },
              {
                icon: Cpu,
                badge: "ARM Cortex-M",
                title:    "Embedded Firmware & RTOS",
                titleAr:  "البرمجيات المدمجة ونظام التشغيل الفوري",
                desc:     "Bare-metal and FreeRTOS firmware on STM32 F4/H7 targets — DMA-driven sensor acquisition at 8 kHz, lock-free ring buffers, CAN/SPI/I2C/USB protocol stacks, and deterministic task scheduling under hard real-time constraints.",
                descAr:   "برمجيات معدنية وFreeRTOS على معالجات STM32 F4/H7 — استقطاب بيانات المستشعرات عبر DMA بتردد 8 كيلوهرتز، ومخازن مؤقتة حلقية خالية من القفل، ومداخل بروتوكول CAN/SPI/I2C/USB، وجدولة مهام حتمية وفق قيود الزمن الفعلي الصارم.",
                tags: ["C / C++", "FreeRTOS", "STM32", "DMA", "CAN Bus"],
              },
              {
                icon: CircuitBoard,
                badge: "ROS2 / Nav2",
                title:    "Robotics & Autonomous Systems",
                titleAr:  "الروبوتات والأنظمة المستقلة",
                desc:     "Full-stack robotic platforms spanning custom sensor PCBs, stereo vision pipelines, and Nav2-based autonomous navigation. Sensor fusion using EKF across IMU, wheel encoders, and lidar — from bench prototype to field-tested deployment.",
                descAr:   "منصات روبوتية متكاملة تشمل لوحات PCB مخصصة للمستشعرات، وأنابيب رؤية ستيريوسكوبية، وملاحة مستقلة مبنية على Nav2. دمج بيانات المستشعرات عبر EKF بين وحدة القياس القصوري ومشفرات العجلات والليدار — من النموذج الأولي إلى الاختبار الميداني.",
                tags: ["ROS2", "SLAM", "EKF Fusion", "OpenCV", "Nav2"],
              },
            ].map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
                whileHover={{
                  y: -6,
                  scale: 1.018,
                  boxShadow: "0 16px 48px rgba(34,211,238,0.08), 0 4px 16px rgba(0,0,0,0.28)",
                }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-[border-color] duration-300 ease-out group flex flex-col gap-4 cursor-default"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-background border border-border flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/35 transition-colors duration-300">
                    <f.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <span className="text-[9px] font-mono font-semibold text-primary/75 tracking-widest uppercase bg-primary/5 border border-primary/15 px-2.5 py-1 rounded-md">
                    {f.badge}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-[13.5px] font-bold text-foreground tracking-tight leading-snug">
                    {t(f.title, f.titleAr)}
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground leading-[1.72]">
                    {t(f.desc, f.descAr)}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                  {f.tags.map(tag => (
                    <span key={tag} className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground/55 group-hover:border-primary/15 transition-colors duration-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Featured Projects ─────────────────────────────── */}
      <section className="section-y relative z-10 bg-background/30 cv-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-10 sm:mb-12">
            <div>
              <p className="text-[11px] font-semibold text-primary uppercase mb-3">
                {t("Portfolio", "معرض الأعمال")}
              </p>
              <h2 className="fluid-h2 font-bold tracking-tighter text-foreground mb-2">
                {t("Featured Work", "أبرز الأعمال")}
              </h2>
              <p className="text-muted-foreground">
                {t(
                  "Select highlights from recent hardware and embedded systems projects.",
                  "أبرز المشاريع الحديثة في هندسة الأجهزة والأنظمة المدمجة.",
                )}
              </p>
            </div>
            <Link href="/projects" className="hidden sm:flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
              {t("View All", "عرض الكل")} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-96 rounded-2xl bg-card animate-pulse border border-border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/50 hover-card-anim flex flex-col relative"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-card/90 backdrop-blur-[8px] border border-border text-foreground">
                      {idx === 0 ? "Active" : "Completed"}
                    </span>
                  </div>
                  <div className="h-48 w-full bg-gradient-to-br from-border/50 to-background relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                    <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                      {project.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 text-[10px] font-mono font-medium rounded bg-background/80 backdrop-blur-[8px] border border-border text-primary uppercase">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold tracking-tight text-foreground mb-2 group-hover:text-primary transition-colors duration-200">
                      {project.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex-grow line-clamp-3 mb-6">
                      {project.description}
                    </p>
                    <Link
                      href={`/projects/${project.id}`}
                      className="w-full py-2.5 text-center text-sm font-medium rounded-lg bg-background border border-border text-foreground group-hover:border-primary/50 group-hover:text-primary transition-colors duration-200"
                    >
                      {t("View Details", "عرض التفاصيل")}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden text-center">
            <Link href="/projects" className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors">
              {t("View All Projects", "عرض جميع المشاريع")} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
