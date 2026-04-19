import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight, Cpu, Layers, Zap, Bot,
  MapPin, Mail,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

// ─── Intersection-observer fade-in ───────────────────────────────────────────

function useFadeIn(threshold = 0.07) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useFadeIn();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section eyebrow label ────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] mb-4"
      style={{ color: "hsl(188 86% 53%)" }}
    >
      <span className="w-5 h-px" style={{ background: "hsl(188 86% 53%)" }} />
      {children}
    </p>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────

function Divider() {
  return (
    <div
      className="w-full h-px my-20 sm:my-24"
      style={{
        background:
          "linear-gradient(to right, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent)",
      }}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function About() {
  const { t, isRTL } = useLanguage();

  return (
    <div className="min-h-screen w-full" dir={isRTL ? "rtl" : "ltr"}>
      <SEO
        title={t("About — Fares Salah", "عن — فارس صلاح")}
        description={t(
          "Hardware engineer specialising in multi-layer PCB design, embedded firmware, and robotics systems.",
          "مهندس أجهزة متخصص في تصميم لوحات PCB متعددة الطبقات، البرمجيات المدمجة، وأنظمة الروبوتات.",
        )}
        keywords="hardware engineer, PCB designer, embedded systems, robotics, Fares Salah"
      />

      {/* ════════════════════════════════════════════════════════════════════
          §1  INTRO — About Me
          Fluid two-column layout matching the Hero's grid algorithm exactly.
          • same radial glow background
          • same max-w-7xl / px-6 lg:px-8 container
          • same gap-10 xl:gap-14 column gap
          • sidebar width: clamp(260px, 28%, 320px) — fluid like col-span-5
          • navbar clearance via spacer div, not top-padding jumps
          ════════════════════════════════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden lg:min-h-screen lg:flex lg:flex-col">

        {/* Background glow — identical to Hero */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,238,0.055) 0%, transparent 68%)",
          }}
        />

        {/* Navbar clearance — same spacer pattern as Hero */}
        <div className="h-[4.5rem]" />

        {/* lg: grows to fill remaining viewport height and centres content */}
        <div className="relative z-10 w-full lg:flex-1 lg:flex lg:items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-0 pb-16 lg:pb-0">

        {/* fluid grid: 1-col mobile → [sidebar | content] desktop */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[clamp(200px,20%,260px)_1fr] gap-10 xl:gap-14 items-start">

          {/* ── Profile card — fluid responsive ────────────────────── */}
          {/* sm/md: constrain to 320px centred so image doesn't balloon on tablet */}
          {/* lg+: grid column controls width, constraint lifted                   */}
          <Reveal delay={0} className="w-full max-w-[260px] mx-auto lg:max-w-none lg:mx-0">
            <div
              className="w-full overflow-hidden rounded-2xl"
              style={{
                background: "rgba(10,15,24,0.72)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 16px 56px rgba(0,0,0,0.5)",
                transition: "box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(-3px)";
                el.style.boxShadow = "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.12)";
                el.style.borderColor = "rgba(34,211,238,0.14)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "0 16px 56px rgba(0,0,0,0.5)";
                el.style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {/* Avatar — aspect-square ensures 1:1 ratio at every width */}
              <div className="relative overflow-hidden">
                <div
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.1)" }}
                />
                <img
                  src={`${import.meta.env.BASE_URL}images/avatar.png`}
                  alt="Eng. Fares Salah"
                  loading="eager"
                  className="w-full aspect-square object-cover object-top grayscale opacity-75 hover:grayscale-0 hover:opacity-95 transition-[filter,opacity] duration-500"
                />
                <div
                  className="absolute bottom-0 inset-x-0 h-20 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(10,15,24,0.85), transparent)" }}
                />
              </div>

              {/* Identity — switches layout/text based on active language */}
              <div
                className="px-5 pb-5 pt-4"
                dir={isRTL ? "rtl" : "ltr"}
                style={{ textAlign: isRTL ? "right" : "left" }}
              >
                {/* Name */}
                <h2
                  className="font-bold text-white leading-tight mb-0.5"
                  style={{
                    fontSize: "clamp(1rem, 3.5vw, 1.15rem)",
                    letterSpacing: isRTL ? "0.01em" : "-0.01em",
                    fontFamily: isRTL
                      ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif"
                      : "'Space Mono', monospace",
                  }}
                >
                  {isRTL ? "م. فارس صلاح" : "Eng. Fares Salah"}
                </h2>

                {/* Role */}
                <p
                  className="text-sm font-medium mb-4 leading-snug"
                  style={{
                    color: "hsl(188 86% 53%)",
                    fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined,
                  }}
                >
                  {isRTL
                    ? "مهندس أجهزة وتصميم دوائر إلكترونية (PCB)"
                    : "Hardware Engineer & PCB Designer"}
                </p>

                {/* Contact details — icon always on the outer edge */}
                <div className="flex flex-col gap-2 mb-5">
                  <div
                    className="flex items-center gap-2 text-xs min-w-0"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      flexDirection: isRTL ? "row-reverse" : "row",
                      justifyContent: isRTL ? "flex-end" : "flex-start",
                    }}
                  >
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: "hsl(188 86% 53% / 0.6)" }} />
                    <span className="truncate">
                      {isRTL ? "الإسكندرية، مصر" : "Alexandria, Egypt"}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs min-w-0"
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      flexDirection: isRTL ? "row-reverse" : "row",
                      justifyContent: isRTL ? "flex-end" : "flex-start",
                    }}
                  >
                    <Mail className="w-3 h-3 shrink-0" style={{ color: "hsl(188 86% 53% / 0.6)" }} />
                    <span className="truncate" dir="ltr">fares@infinitytech.dev</span>
                  </div>
                </div>

                {/* CTA button */}
                <Link
                  href="/contact"
                  className="block w-full py-2.5 rounded-xl text-center font-bold active:scale-[0.97]"
                  style={{
                    background: "hsl(188 86% 53%)",
                    color: "#0a0f18",
                    fontSize: isRTL ? "0.95rem" : "0.875rem",
                    fontFamily: isRTL
                      ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif"
                      : undefined,
                    letterSpacing: isRTL ? "0.02em" : undefined,
                    transition: "background 0.2s ease, box-shadow 0.25s ease",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "hsl(188 86% 47%)";
                    el.style.boxShadow = "0 0 20px rgba(34,211,238,0.4)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "hsl(188 86% 53%)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {isRTL ? "اتصل بنا" : "Contact"}
                </Link>
              </div>
            </div>
          </Reveal>

          {/* ── Bio ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-7 lg:pt-2">

            <Reveal delay={80}>
              <Eyebrow>{t("About Me", "عني")}</Eyebrow>
              <h2
                className="fluid-h2 font-black text-white tracking-tight"
                style={{ marginTop: "4px" }}
              >
                {t(
                  <>Engineer by passion,<br />builder by nature.</>,
                  <>مهندس بالشغف،<br />مبتكر بالطبيعة.</>,
                )}
              </h2>
            </Reveal>

            <Reveal delay={160}>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t(
                  "I'm a hardware engineer based in Alexandria, specialising in the full electronics stack — from silicon-level schematic capture and multi-layer PCB design, through bare-metal firmware, to real-time robotic control systems.",
                  "أنا مهندس أجهزة مقيم في الإسكندرية، متخصص في المكدس الإلكتروني الكامل — من رسم المخططات على مستوى السيليكون وتصميم لوحات PCB متعددة الطبقات، وصولاً إلى البرمجيات المدمجة وأنظمة التحكم الروبوتي الآني.",
                )}
              </p>
            </Reveal>

            <Reveal delay={220}>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t(
                  "My philosophy is first-principles design: understand the system from the substrate up, then build with precision. Constraints are fuel — not obstacles.",
                  "فلسفتي هي التصميم من المبادئ الأولى: فهم النظام من الطبقة الأساسية، ثم البناء بدقة. القيود وقود — ليست عوائق.",
                )}
              </p>
            </Reveal>

            {/* Stats row */}
            <Reveal delay={300}>
              <div
                className="grid grid-cols-3 gap-4 pt-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                {[
                  { value: "5+", labelEn: "Years",    labelAr: "سنوات" },
                  { value: "30+", labelEn: "Projects", labelAr: "مشروع" },
                  { value: "4",   labelEn: "Domains",  labelAr: "مجالات" },
                ].map((stat) => (
                  <div key={stat.value} className="text-center">
                    <p
                      className="font-black mb-0.5"
                      style={{
                        color: "hsl(188 86% 53%)",
                        fontSize: "clamp(1.5rem, 3.5vw, 2rem)",
                      }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-[11px] font-semibold uppercase tracking-widest"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {isRTL ? stat.labelAr : stat.labelEn}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
        </div>{/* /container */}
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          §2  VISION
          Single clean paragraph + icon-bullet list.
          The 2×2 feature grid is replaced with an icon list for clarity.
          ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Divider />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Text column */}
          <div className="space-y-6">
            <Reveal delay={0}>
              <Eyebrow>{t("Vision", "الرؤية")}</Eyebrow>
              <h2
                className="fluid-h2 font-black text-white tracking-tight"
                style={{ marginTop: "4px" }}
              >
                {t(
                  <>The future is physical —<br />and programmable.</>,
                  <>المستقبل مادي —<br />وقابل للبرمجة.</>,
                )}
              </h2>
            </Reveal>

            <Reveal delay={100}>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t(
                  "The next paradigm shift isn't just in software — it's in how software interacts with the physical world. Intelligent machines need nervous systems built with precision, from the silicon up.",
                  "التحول النموذجي القادم ليس في البرمجيات وحدها — بل في كيفية تفاعل البرمجيات مع العالم المادي. تحتاج الآلات الذكية إلى أنظمة عصبية مبنية بدقة، من السيليكون إلى الأعلى.",
                )}
              </p>
            </Reveal>

            <Reveal delay={180}>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                {t(
                  "With Infinity, my goal is to co-design hardware and software from the ground up — optimised together, deployed with confidence.",
                  "مع إنفينيتي، هدفي هو تصميم الأجهزة والبرمجيات معاً من الصفر — مُحسَّنان معاً، ومُنشَران بثقة.",
                )}
              </p>
            </Reveal>
          </div>

          {/* Icon bullet list */}
          <Reveal delay={120}>
            <div className="flex flex-col gap-4">
              {[
                {
                  icon: <Layers className="w-4 h-4" />,
                  titleEn: "Co-designed architectures",
                  titleAr: "بنيات مُصمَّمة معاً",
                  descEn: "Hardware and firmware designed as one system, not bolted together.",
                  descAr: "الأجهزة والبرمجيات مُصمَّمة كنظام واحد، لا كقطعتين مُجمَّعتين.",
                },
                {
                  icon: <Zap className="w-4 h-4" />,
                  titleEn: "Power-aware systems",
                  titleAr: "أنظمة واعية بالطاقة",
                  descEn: "Every µA matters — from register settings to PCB copper weight.",
                  descAr: "كل ميكروأمبير مهم — من ضبط الريجيستر إلى وزن النحاس في اللوحة.",
                },
                {
                  icon: <Bot className="w-4 h-4" />,
                  titleEn: "Real-time autonomy",
                  titleAr: "استقلالية آنية",
                  descEn: "Hard real-time RTOS, PID loops, and multi-sensor fusion.",
                  descAr: "RTOS صارم، حلقات PID، ودمج متعدد الحساسات.",
                },
                {
                  icon: <Cpu className="w-4 h-4" />,
                  titleEn: "Silicon to deployment",
                  titleAr: "من السيليكون إلى النشر",
                  descEn: "Full-stack ownership: concept → schematic → PCB → firmware → field.",
                  descAr: "ملكية كاملة: فكرة ← مخطط ← لوحة ← برمجيات ← ميدان.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    transition: "border-color 0.25s ease, background 0.25s ease",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(34,211,238,0.18)";
                    el.style.background = "rgba(34,211,238,0.03)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.background = "rgba(255,255,255,0.025)";
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "rgba(34,211,238,0.1)", color: "hsl(188 86% 53%)" }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white mb-0.5">
                      {isRTL ? item.titleAr : item.titleEn}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {isRTL ? item.descAr : item.descEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          §4  CTA — Premium "Let's Build"
          Layered gradient, top-edge glow, strong headline, single button.
          ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 md:pb-32">
        <Divider />

        <Reveal delay={0}>
          <div
            className="relative overflow-hidden rounded-3xl px-8 py-16 sm:px-16 sm:py-20 text-center"
            style={{
              background:
                "linear-gradient(160deg, rgba(34,211,238,0.07) 0%, rgba(10,15,24,0.4) 40%, rgba(10,15,24,0.4) 60%, rgba(96,165,250,0.05) 100%)",
              border: "1px solid rgba(34,211,238,0.12)",
            }}
          >
            {/* Top glow line */}
            <div
              className="absolute top-0 inset-x-0 h-px pointer-events-none"
              style={{ background: "linear-gradient(to right, transparent, rgba(34,211,238,0.35), transparent)" }}
            />
            {/* Ambient blur orb */}
            <div
              className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full pointer-events-none blur-3xl"
              style={{ background: "rgba(34,211,238,0.05)" }}
            />

            <div className="relative">
              <Eyebrow>{t("Let's Build", "لنبني معاً")}</Eyebrow>

              <h2
                className="fluid-h1 font-black text-white tracking-tight leading-tight mt-2 mb-4"
              >
                {t(
                  <>Have a project<br />in mind?</>,
                  <>لديك مشروع<br />في ذهنك؟</>,
                )}
              </h2>

              <p
                className="text-base mx-auto mb-10"
                style={{ color: "rgba(255,255,255,0.45)", maxWidth: "440px" }}
              >
                {t(
                  "From first schematic to production hardware — let's engineer it right, from day one.",
                  "من أول مخطط إلى الأجهزة الإنتاجية — لنهندسها بشكل صحيح، من اليوم الأول.",
                )}
              </p>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold tracking-wide active:scale-[0.97]"
                style={{
                  background: "hsl(188 86% 53%)",
                  color: "#0a0f18",
                  transition: "background 0.2s ease, box-shadow 0.25s ease, transform 0.15s ease",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "hsl(188 86% 47%)";
                  el.style.boxShadow = "0 0 36px rgba(34,211,238,0.5), 0 8px 24px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "hsl(188 86% 53%)";
                  el.style.boxShadow = "none";
                }}
              >
                {t("Start a Project", "ابدأ مشروعًا")}
                <ArrowRight
                  className="w-4 h-4"
                  style={{ transform: isRTL ? "scaleX(-1)" : "none" }}
                />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
