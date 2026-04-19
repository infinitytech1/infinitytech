import { useState, useRef, useEffect } from "react";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/dist/css/intlTelInput.css";
import { SEO } from "@/components/SEO";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MapPin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitContactForm } from "@/hooks/use-projects";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Form schema (phone validated separately via ITI) ──────────────────────────
const formSchema = z.object({
  name:    z.string().min(2, "Name is too short"),
  subject: z.string().min(5, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});
type FormValues = z.infer<typeof formSchema>;


// ── CSS-only fade-in ─────────────────────────────────────────────────────────
function useFadeIn(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { ref, vis } = useFadeIn();
  return (
    <div ref={ref} className={className} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(14px)",
      transition: `opacity 0.48s ease ${delay}ms, transform 0.48s ease ${delay}ms`,
      willChange: "transform, opacity",
    }}>
      {children}
    </div>
  );
}

// ── Social links data ─────────────────────────────────────────────────────────
const SOCIALS = [
  {
    id: "linkedin",
    label: "LinkedIn",
    sub: "/in/fares-salah-eng",
    href: "https://linkedin.com/in/fares-salah-eng",
    color: "#0A66C2",
    glow: "0 0 0 1px rgba(10,102,194,0.45), 0 0 24px rgba(10,102,194,0.2)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
        <path d="M20.447 20.452H16.89v-5.569c0-1.328-.024-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a1.974 1.974 0 1 1 0-3.948 1.974 1.974 0 0 1 0 3.948zm1.707 13.019H3.63V9h3.414v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: "github",
    label: "GitHub",
    sub: "/infinitytech-dev",
    href: "https://github.com/infinitytech-dev",
    color: "#e6edf3",
    glow: "0 0 0 1px rgba(230,237,243,0.3), 0 0 24px rgba(230,237,243,0.1)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X (Twitter)",
    sub: "@InfinityTech_",
    href: "https://x.com/InfinityTech_",
    color: "#e7e9ea",
    glow: "0 0 0 1px rgba(231,233,234,0.25), 0 0 24px rgba(231,233,234,0.1)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: "email",
    label: "Email",
    sub: "admin.infinity.tech@gmail.com",
    href: "mailto:admin.infinity.tech@gmail.com",
    color: "hsl(188 86% 53%)",
    glow: "0 0 0 1px rgba(34,211,238,0.4), 0 0 24px rgba(34,211,238,0.15)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" aria-hidden="true">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
  
];

// ── Social card ───────────────────────────────────────────────────────────────
function SocialCard({ s }: { s: typeof SOCIALS[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={s.href}
      target={s.id !== "email" ? "_blank" : undefined}
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: "14px",
        padding: "14px 18px", borderRadius: "14px",
        background: hovered ? "rgba(255,255,255,0.04)" : "rgba(10,15,24,0.6)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: hovered ? s.glow : "none",
        color: hovered ? s.color : "rgba(255,255,255,0.45)",
        textDecoration: "none",
        transition: "background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, color 0.22s ease",
        willChange: "transform",
      }}
    >
      <span style={{ flexShrink: 0 }}>{s.icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{
          display: "block", fontSize: "13px", fontWeight: 600, lineHeight: 1.3,
          color: hovered ? s.color : "rgba(255,255,255,0.75)",
          transition: "color 0.22s ease",
        }}>
          {s.label}
        </span>
        <span style={{
          display: "block", fontSize: "11px", color: "rgba(255,255,255,0.3)",
          marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {s.sub}
        </span>
      </span>
    </a>
  );
}

// ── Shared field wrapper ──────────────────────────────────────────────────────
function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)", marginBottom: "10px",
      }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: "11px", color: "hsl(0 84% 60%)", marginTop: "5px" }}>
          {error}
        </p>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", background: "transparent", border: "none",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  padding: "10px 0", fontSize: "14px",
  color: "rgba(255,255,255,0.85)", outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  fontFamily: "inherit",
};

function SlimInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      autoComplete="one-time-code"
      spellCheck={false}
      {...props}
      className={`contact-dark-input${props.className ? ` ${props.className}` : ""}`}
      style={{
        ...inputBase,
        borderBottomColor: focused ? "hsl(188 86% 53%)" : "rgba(255,255,255,0.12)",
        boxShadow: focused ? "0 1px 0 hsl(188 86% 53%)" : "none",
        caretColor: "hsl(188 86% 53%)",
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function SlimTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      autoComplete="off"
      spellCheck={false}
      {...props}
      className={`contact-dark-input${props.className ? ` ${props.className}` : ""}`}
      style={{
        ...inputBase, resize: "none", minHeight: "100px", display: "block",
        borderBottomColor: focused ? "hsl(188 86% 53%)" : "rgba(255,255,255,0.12)",
        boxShadow: focused ? "0 1px 0 hsl(188 86% 53%)" : "none",
        caretColor: "hsl(188 86% 53%)",
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

// ── intl-tel-input phone field ────────────────────────────────────────────────
interface ItiPhoneFieldProps {
  label: string;
  error?: string;
  resetTrigger: number;
  onItiReady: (iti: ReturnType<typeof intlTelInput>) => void;
  onClearError: () => void;
  isRTL: boolean;
  lang: string;
}

function ItiPhoneField({ label, error, resetTrigger, onItiReady, onClearError, isRTL, lang }: ItiPhoneFieldProps) {
  const inputRef      = useRef<HTMLInputElement>(null);
  const itiRef        = useRef<ReturnType<typeof intlTelInput> | null>(null);
  const searchElRef   = useRef<HTMLInputElement | null>(null);
  const isRTLRef      = useRef(isRTL);
  const langRef       = useRef(lang);
  const [focused,    setFocused]    = useState(false);
  const [validState, setValidState] = useState<"idle" | "valid" | "invalid">("idle");

  // Keep refs in sync with current prop values (needed inside stable event-listener closures)
  useEffect(() => { isRTLRef.current = isRTL; langRef.current = lang; }, [isRTL, lang]);

  /** Push dir + placeholder onto the ITI-rendered search <input> */
  const syncSearch = (rtl: boolean, language: string) => {
    if (!searchElRef.current) {
      // Lazy-find: the dropdown lives inside the nearest .iti ancestor
      const itiRoot = inputRef.current?.closest(".iti");
      searchElRef.current = itiRoot?.querySelector<HTMLInputElement>(".iti__search-input") ?? null;
    }
    const el = searchElRef.current;
    if (!el) return;
    el.dir         = rtl ? "rtl" : "ltr";
    el.placeholder = language === "ar" ? "ابحث عن دولة..." : "Search country...";
  };

  // Reset internal state when parent signals a form reset
  useEffect(() => {
    if (resetTrigger === 0) return;
    setValidState("idle");
    if (inputRef.current) inputRef.current.value = "";
  }, [resetTrigger]);

  // Re-sync search input whenever language toggles (works even if dropdown is not open)
  useEffect(() => {
    syncSearch(isRTL, lang);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRTL, lang]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const iti = intlTelInput(el, {
      initialCountry: "auto",
      geoIpLookup: (cb) => {
        fetch("https://ipapi.co/json")
          .then(r => r.json())
          .then(d => cb((d.country_code || "eg").toLowerCase()))
          .catch(() => cb("eg"));
      },
      separateDialCode: true,
      countryOrder: ["eg", "sa", "ae", "kw", "gb", "us"],
      loadUtils: () => import("intl-tel-input/dist/js/utils.js"),
    });

    itiRef.current = iti;
    onItiReady(iti);

    // Sync after a tick (the dropdown DOM is rendered immediately but may need a frame)
    const t = setTimeout(() => syncSearch(isRTLRef.current, langRef.current), 60);

    // Also re-sync every time the user opens the dropdown (catches lazy renders)
    const onOpen = () => syncSearch(isRTLRef.current, langRef.current);
    el.addEventListener("open:countrydropdown", onOpen);

    const checkValidity = () => {
      onClearError();
      const raw = el.value.trim();
      if (!raw) { setValidState("idle"); return; }
      setValidState(iti.isValidNumber() === true ? "valid" : "invalid");
    };

    el.addEventListener("input", checkValidity);
    el.addEventListener("countrychange", checkValidity);

    return () => {
      clearTimeout(t);
      el.removeEventListener("open:countrydropdown", onOpen);
      el.removeEventListener("input", checkValidity);
      el.removeEventListener("countrychange", checkValidity);
      iti.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const borderColor = error
    ? "hsl(0 84% 60%)"
    : validState === "valid"
    ? "#22c55e"
    : validState === "invalid"
    ? "hsl(0 84% 60%)"
    : focused
    ? "hsl(188 86% 53%)"
    : "rgba(255,255,255,0.12)";

  const shadowColor = error
    ? "0 1px 0 hsl(0 84% 60%)"
    : validState === "valid"
    ? "0 1px 0 #22c55e"
    : validState === "invalid"
    ? "0 1px 0 hsl(0 84% 60%)"
    : focused
    ? "0 1px 0 hsl(188 86% 53%)"
    : "none";

  return (
    <div>
      <label style={{
        display: "block", fontSize: "11px", fontWeight: 600,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.35)", marginBottom: "10px",
      }}>
        {label}
      </label>

      <div style={{
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: shadowColor,
        transition: "border-color 0.22s ease, box-shadow 0.22s ease",
        paddingBottom: "2px",
      }}>
        <input
          ref={inputRef}
          type="tel"
          inputMode="tel"
          autoComplete="one-time-code"
          spellCheck={false}
          className="contact-dark-input"
          style={{
            width: "100%", background: "transparent", border: "none",
            padding: "10px 0", fontSize: "14px",
            color: "rgba(255,255,255,0.85)", outline: "none",
            caretColor: "hsl(188 86% 53%)", fontFamily: "inherit",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>

      {validState === "valid" && !error && (
        <p style={{ fontSize: "11px", color: "#22c55e", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          رقم صحيح ✓
        </p>
      )}

      {(error || (validState === "invalid" && !error)) && (
        <p style={{ fontSize: "11px", color: "hsl(0 84% 60%)", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error || "يرجى التأكد من عدد أرقام الهاتف بشكل صحيح"}
        </p>
      )}

      {/* ── Dark-theme CSS overrides for intl-tel-input + global input hard reset ── */}
      <style>{`
        /* ════════════════════════════════════════════════════════════════
           GLOBAL INPUT HARD RESET
           Covers every state: normal, hover, focus, active, typing.
           Background NEVER changes — only border-color is allowed to.
        ════════════════════════════════════════════════════════════════ */
        .contact-dark-input,
        .contact-dark-input:hover,
        .contact-dark-input:focus,
        .contact-dark-input:active,
        .contact-dark-input:focus-visible {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none;
        }

        /* ── Autofill hard reset ─────────────────────────────────────────
           -webkit-background-clip: text  → clips the autofill fill to text
           area only, making the injected background invisible.
           -webkit-box-shadow inset       → paints over any remaining bg.
           transition 9999s               → freezes the fade-in animation
           so the yellow/white flash never renders.
        ─────────────────────────────────────────────────────────────── */
        .contact-dark-input:-webkit-autofill,
        .contact-dark-input:-webkit-autofill:hover,
        .contact-dark-input:-webkit-autofill:focus,
        .contact-dark-input:-webkit-autofill:active,
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active,
        textarea:-webkit-autofill,
        textarea:-webkit-autofill:hover,
        textarea:-webkit-autofill:focus,
        textarea:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: rgba(255,255,255,0.85) !important;
          -webkit-box-shadow: 0 0 0px 1000px #0a0f18 inset !important;
          box-shadow: 0 0 0px 1000px #0a0f18 inset !important;
          background-color: #0a0f18 !important;
          caret-color: hsl(188 86% 53%) !important;
          transition: background-color 9999s ease-in-out 0s !important;
        }

        /* ════════════════════════════════════════════════════════════════
           ITI v27 — Override CSS custom properties at the root level.
           This kills the white defaults before any class rule fires.
        ════════════════════════════════════════════════════════════════ */
        .iti {
          --iti-dropdown-bg: rgba(12, 14, 22, 0.97);
          --iti-border-color: rgba(255,255,255,0.06);
          --iti-hover-color: rgba(255,255,255,0.05);
          --iti-icon-color: rgba(148,175,202,0.5);
          width: 100%;
        }

        /* ── Flag-selector trigger (v27: .iti__selected-country) ── */
        .iti__country-container { padding: 0 !important; }
        .iti__selected-country,
        .iti__selected-country-primary {
          background: transparent !important;
          border: none !important;
          gap: 6px !important;
          transition: background 0.25s ease !important;
        }
        .iti__selected-country-primary {
          padding: 0 8px 0 0 !important;
          height: 100% !important;
        }
        .iti__selected-country:hover .iti__selected-country-primary,
        .iti__selected-country-primary:hover {
          background: rgba(255,255,255,0.04) !important;
          border-radius: 6px !important;
        }
        .iti__selected-dial-code {
          color: rgba(255,255,255,0.5) !important;
          font-size: 13px !important;
          font-family: inherit !important;
          letter-spacing: 0.03em !important;
          font-weight: 500 !important;
        }
        /* Arrow — v27 uses a rotated square chevron, not a triangle */
        .iti__arrow {
          border-right-color: rgba(255,255,255,0.3) !important;
          border-bottom-color: rgba(255,255,255,0.3) !important;
          margin-left: 5px !important;
          transition: border-color 0.25s ease, transform 0.25s ease !important;
        }
        .iti__arrow--up {
          border-right-color: hsl(188 86% 53%) !important;
          border-bottom-color: hsl(188 86% 53%) !important;
        }

        /* ── Phone input field ── */
        .iti input[type=tel],
        .iti input[type=text] {
          background: transparent !important;
          background-color: transparent !important;
          color: rgba(255,255,255,0.9) !important;
          border: none !important;
          outline: none !important;
          caret-color: hsl(188 86% 53%) !important;
        }
        .iti input[type=tel]:focus,
        .iti input[type=text]:focus {
          background: transparent !important;
          background-color: transparent !important;
        }
        .iti input[type=tel]::placeholder { color: rgba(255,255,255,0.2) !important; }
        .iti input[type=tel]:-webkit-autofill,
        .iti input[type=tel]:-webkit-autofill:hover,
        .iti input[type=tel]:-webkit-autofill:focus,
        .iti input[type=tel]:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: rgba(255,255,255,0.9) !important;
          -webkit-box-shadow: 0 0 0px 1000px #0a0f18 inset !important;
          transition: background-color 9999s ease-in-out 0s !important;
        }

        /* ════════════════════════════════════════════════════════════════
           DROPDOWN — the outer shell is .iti__dropdown-content in v27.
           THIS is what had the white background. Target it directly.
        ════════════════════════════════════════════════════════════════ */
        .iti__dropdown-content {
          background: rgba(12, 14, 22, 0.97) !important;
          backdrop-filter: blur(20px) saturate(150%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(150%) !important;
          border: 1px solid rgba(255,255,255,0.06) !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow:
            0 24px 64px rgba(0,0,0,0.85),
            inset 0 1px 0 rgba(255,255,255,0.04) !important;
          margin-top: 8px !important;
          z-index: 9999 !important;
          min-width: 280px !important;
        }

        /* ── Scrollable country list (sits inside .iti__dropdown-content) ── */
        .iti__country-list {
          list-style: none !important;
          padding: 0 0 8px !important;
          margin: 0 !important;
          max-height: 240px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          scrollbar-width: thin !important;
          scrollbar-color: rgba(255,255,255,0.1) transparent !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          border-radius: 0 !important;
        }
        .iti__country-list::-webkit-scrollbar { width: 2px !important; }
        .iti__country-list::-webkit-scrollbar-track { background: transparent !important; }
        .iti__country-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1) !important;
          border-radius: 99px !important;
        }

        /* ════════════════════════════════════════════════════════════════
           SEARCH BAR — v27 DOM structure:
             .iti__search-input-wrapper (position:relative, flex)
               .iti__search-icon        (position:absolute — magnifying glass SVG)
               input.iti__search-input  (the text field)
               button.iti__search-clear (position:absolute — X button)

           Icon/button positioning adapts to text direction automatically:
             LTR → glass on LEFT,  X on RIGHT
             RTL → glass on RIGHT, X on LEFT  (via [dir=rtl] selectors)
        ════════════════════════════════════════════════════════════════ */

        /* Wrapper: dark separator below, padding creates breathing room */
        .iti__search-input-wrapper {
          border-bottom: 1px solid rgba(255,255,255,0.06) !important;
          background: transparent !important;
          padding: 10px 10px 0 !important;
          position: relative !important;
          display: flex !important;
          align-items: center !important;
        }

        /* ── Text input — NO background-image (icon is a real sibling SVG) ── */
        .iti__search-input {
          background: rgba(8, 10, 16, 0.85) !important;
          background-color: rgba(8, 10, 16, 0.85) !important;
          background-image: none !important;
          border: 1px solid rgba(34,211,238,0.18) !important;
          border-radius: 8px !important;
          color: rgba(255,255,255,0.9) !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          letter-spacing: 0.01em !important;
          /* 40px on both sides keeps text clear of either icon */
          padding: 9px 40px !important;
          outline: none !important;
          font-family: inherit !important;
          box-sizing: border-box !important;
          display: block !important;
          width: 100% !important;
          margin: 0 0 10px !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          line-height: 1.4 !important;
          transition: border-color 0.22s ease !important;
        }
        .iti__search-input::placeholder {
          color: rgba(255,255,255,0.22) !important;
          font-style: normal !important;
        }
        /* Focus: only brighten the border, NO outer glow / box-shadow */
        .iti__search-input:focus {
          border-color: hsl(188 86% 53%) !important;
          background-color: rgba(8, 10, 16, 0.95) !important;
          box-shadow: none !important;
          outline: none !important;
        }
        /* Suppress browser native search-cancel / decoration on webkit */
        .iti__search-input::-webkit-search-cancel-button,
        .iti__search-input::-webkit-search-decoration,
        .iti__search-input::-webkit-search-results-button,
        .iti__search-input::-webkit-search-results-decoration {
          -webkit-appearance: none !important;
          display: none !important;
        }
        .iti__search-input:-webkit-autofill,
        .iti__search-input:-webkit-autofill:hover,
        .iti__search-input:-webkit-autofill:focus,
        .iti__search-input:-webkit-autofill:active {
          -webkit-background-clip: text !important;
          background-clip: text !important;
          -webkit-text-fill-color: rgba(255,255,255,0.9) !important;
          -webkit-box-shadow: 0 0 0px 1000px #080a10 inset !important;
          transition: background-color 9999s ease-in-out 0s !important;
        }

        /* ── Magnifying-glass icon (LTR: left side) ── */
        .iti__search-icon {
          left: 20px !important;
          right: auto !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          pointer-events: none !important;
          z-index: 1 !important;
          /* offset for the input's bottom margin so icon stays on the input */
          margin-bottom: 10px !important;
        }
        .iti__search-icon-svg {
          stroke: rgba(148,175,202,0.55) !important;
          width: 15px !important;
          height: 15px !important;
          display: block !important;
        }
        .iti__search-input-wrapper:focus-within .iti__search-icon-svg {
          stroke: hsl(188 86% 53%) !important;
        }

        /* ── Clear (X) button (LTR: right side) ── */
        .iti__search-clear {
          right: 20px !important;
          left: auto !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          background: transparent !important;
          border: none !important;
          padding: 4px !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          margin-bottom: 10px !important;
          transition: background 0.18s ease !important;
        }
        .iti__search-clear:hover,
        .iti__search-clear:focus-visible {
          background: rgba(255,255,255,0.08) !important;
          outline: none !important;
        }
        .iti__search-clear-svg { width: 13px !important; height: 13px !important; display: block !important; }
        .iti__search-clear .iti__search-clear-bg { fill: rgba(148,175,202,0.5) !important; }
        .iti__search-clear:hover .iti__search-clear-bg { fill: rgba(200,225,240,0.72) !important; }

        /* ── RTL: mirror icon placement ───────────────────────────────────
           When the page (or the search input itself) is in RTL mode,
           swap the magnifying glass to the right and the X to the left.
           Both [dir=rtl] on the page AND input[dir=rtl] are handled.
        ─────────────────────────────────────────────────────────────── */
        [dir="rtl"] .iti__search-icon,
        .iti__search-input-wrapper:has(.iti__search-input[dir="rtl"]) .iti__search-icon {
          left: auto !important;
          right: 20px !important;
        }
        [dir="rtl"] .iti__search-input,
        .iti__search-input[dir="rtl"] {
          padding-left: 40px !important;
          padding-right: 40px !important;
          text-align: right !important;
        }
        [dir="rtl"] .iti__search-clear,
        .iti__search-input-wrapper:has(.iti__search-input[dir="rtl"]) .iti__search-clear {
          right: auto !important;
          left: 20px !important;
        }

        /* ── Country rows — ruler-straight three-column layout ── */
        .iti__country {
          padding: 8px 14px !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          cursor: pointer !important;
          color: rgba(255,255,255,0.6) !important;
          font-size: 13px !important;
          font-weight: 400 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif !important;
          letter-spacing: 0.01em !important;
          border-left: 2px solid transparent !important;
          transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease !important;
          background: transparent !important;
        }
        .iti__country:hover {
          background: rgba(255,255,255,0.05) !important;
          color: rgba(255,255,255,0.92) !important;
          border-left-color: rgba(34,211,238,0.4) !important;
        }
        .iti__country.iti__highlight,
        .iti__country[aria-selected="true"] {
          background: rgba(34,211,238,0.08) !important;
          color: #fff !important;
          border-left-color: hsl(188 86% 53%) !important;
        }

        /* Col 1 — Flag: fixed 22px wide so every name starts at the same X */
        .iti__flag-box {
          flex: 0 0 22px !important;
          width: 22px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-start !important;
          line-height: 1 !important;
        }
        .iti__flag {
          border-radius: 2px !important;
          flex-shrink: 0 !important;
        }
        /* v27 adds margin-right via .iti__country-list .iti__flag — strip it */
        .iti__country-list .iti__flag {
          margin-right: 0 !important;
          margin-left: 0 !important;
        }

        /* Col 2 — Country name: fills all remaining horizontal space */
        .iti__country-name {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          color: inherit !important;
        }

        /* Col 3 — Dial code: pinned right, tabular-nums, teal accent */
        .iti__dial-code {
          flex: 0 0 auto !important;
          font-size: 11.5px !important;
          font-weight: 500 !important;
          letter-spacing: 0.04em !important;
          font-variant-numeric: tabular-nums !important;
          color: rgba(34,211,238,0.55) !important;
          background: rgba(34,211,238,0.06) !important;
          border: 1px solid rgba(34,211,238,0.12) !important;
          border-radius: 5px !important;
          padding: 1px 7px !important;
          white-space: nowrap !important;
          transition: color 0.25s ease, background 0.25s ease, border-color 0.25s ease !important;
        }
        .iti__country:hover .iti__dial-code {
          color: rgba(34,211,238,0.85) !important;
          background: rgba(34,211,238,0.1) !important;
          border-color: rgba(34,211,238,0.25) !important;
        }
        .iti__country.iti__highlight .iti__dial-code,
        .iti__country[aria-selected="true"] .iti__dial-code {
          color: hsl(188 86% 65%) !important;
          background: rgba(34,211,238,0.12) !important;
          border-color: rgba(34,211,238,0.3) !important;
        }

        /* ── Divider between preferred + full list ── */
        .iti__divider {
          border: none !important;
          border-top: 1px solid rgba(255,255,255,0.05) !important;
          margin: 4px 12px !important;
        }
      `}</style>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function Contact() {
  const { toast } = useToast();
  const [phoneError,    setPhoneError]    = useState("");
  const [isSending,     setIsSending]     = useState(false);
  const [resetTrigger,  setResetTrigger]  = useState(0);
  const { t, isRTL, lang } = useLanguage();
  const itiRef = useRef<ReturnType<typeof intlTelInput> | null>(null);
  const handleItiReady = (iti: ReturnType<typeof intlTelInput>) => { itiRef.current = iti; };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", subject: "", message: "" },
  });

  const onSubmit = async (data: FormValues) => {
    const iti = itiRef.current;
    if (!iti?.isValidNumber()) {
      setPhoneError(
        t("Please enter a valid phone number with a complete number of digits",
          "يرجى إدخال رقم هاتف صحيح بعدد أرقام مكتمل"),
      );
      return;
    }

    setPhoneError("");
    const finalPhoneNumber = iti.getNumber();

    setIsSending(true);
    try {
      await submitContactForm({ ...data, phone: finalPhoneNumber } as any);
      toast({
        title: t("Message Sent", "تم إرسال الرسالة"),
        description: t(
          "Thanks for reaching out! I'll get back to you soon.",
          "شكرًا لتواصلك! سأرد عليك في أقرب وقت.",
        ),
      });
      // Reset form fields + phone field valid state
      form.reset();
      setPhoneError("");
      setResetTrigger(n => n + 1);
    } catch {
      toast({
        variant: "destructive",
        title: t("Error", "خطأ"),
        description: t("Something went wrong. Please try again.", "حدث خطأ ما. يرجى المحاولة مرة أخرى."),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative" dir={isRTL ? "rtl" : "ltr"}>
      <SEO
        title={t("Contact", "التواصل")}
        description={t(
          "Get in touch with Fares Salah for hardware engineering consulting, PCB design projects, or technical collaboration.",
          "تواصل مع فارس صلاح للاستشارات الهندسية، مشاريع تصميم PCB، أو فرص التعاون التقني.",
        )}
        keywords="contact hardware engineer, PCB design consulting, embedded systems"
      />

      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,211,238,0.055) 0%, transparent 68%)" }}
      />

      <div className="h-[4.5rem]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <Reveal className="mb-14 sm:mb-18" delay={0}>
          <p
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] mb-4"
            style={{ color: "hsl(188 86% 53%)" }}
          >
            <span className="w-5 h-px" style={{ background: "hsl(188 86% 53%)" }} />
            {t("Get in Touch", "تواصل معي")}
          </p>
          <h1
            className="font-black text-white tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw + 0.5rem, 3.5rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}
          >
            {t(
              <>Initialize <span style={{ color: "hsl(188 86% 53%)" }}>Connection</span></>,
              <>ابدأ <span style={{ color: "hsl(188 86% 53%)" }}>التواصل</span></>,
            )}
          </h1>
          <p
            className="mt-4 text-base leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.45)", fontSize: "clamp(0.875rem, 1.5vw + 0.25rem, 1.0625rem)" }}
          >
            {t(
              "Whether you have a project, an open role, or just want to talk tech — drop a message.",
              "سواء كان لديك مشروع، أو دور مفتوح، أو تريد الحديث عن التقنية — أرسل رسالة.",
            )}
          </p>
        </Reveal>

        {/* ── Two-column grid ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_clamp(300px,36%,440px)] gap-10 xl:gap-16 items-start">

          {/* ── Left: Form ───────────────────────────────────────────────── */}
          <Reveal delay={80}>
            <div style={{
              background: "rgba(10,15,24,0.6)", backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "14px", padding: "clamp(24px, 4vw, 44px)",
            }}>
              <p style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "28px",
              }}>
                {t("Send a Message", "أرسل رسالة")}
              </p>

              <form onSubmit={form.handleSubmit(onSubmit)} noValidate autoComplete="off" style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                  <Field label={t("Name", "الاسم")} error={form.formState.errors.name?.message}>
                    <SlimInput
                      {...form.register("name")}
                      dir="ltr"
                      placeholder={t("John Doe", "محمد أحمد")}
                    />
                  </Field>

                  <ItiPhoneField
                    label={t("WhatsApp Number", "رقم الواتساب")}
                    error={phoneError}
                    resetTrigger={resetTrigger}
                    onItiReady={handleItiReady}
                    onClearError={() => setPhoneError("")}
                    isRTL={isRTL}
                    lang={lang}
                  />
                </div>

                <Field label={t("Subject", "الموضوع")} error={form.formState.errors.subject?.message}>
                  <SlimInput
                    {...form.register("subject")}
                    dir="ltr"
                    placeholder={t("Project Inquiry", "الاستفسار عن مشروع")}
                  />
                </Field>

                <Field label={t("Message", "الرسالة")} error={form.formState.errors.message?.message}>
                  <SlimTextarea
                    {...form.register("message")}
                    dir="ltr"
                    rows={5}
                    placeholder={t("How can we build the future together?", "كيف يمكننا بناء المستقبل معاً؟")}
                  />
                </Field>

                <div>
                  <button
                    type="submit"
                    disabled={isSending}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "8px",
                      padding: "13px 32px", background: "hsl(188 86% 53%)", color: "#0a0f18",
                      fontWeight: 700, fontSize: "14px", borderRadius: "12px", border: "none",
                      cursor: isSending ? "not-allowed" : "pointer",
                      opacity: isSending ? 0.6 : 1,
                      transition: "background 0.2s ease, box-shadow 0.25s ease",
                      willChange: "transform",
                    }}
                    onMouseEnter={e => {
                      if (isSending) return;
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "hsl(188 86% 46%)";
                      el.style.boxShadow = "0 0 28px rgba(34,211,238,0.4)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.background = "hsl(188 86% 53%)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {isSending ? (
                      <>
                        <div style={{
                          width: 15, height: 15, borderRadius: "50%",
                          border: "2px solid #0a0f18", borderTopColor: "transparent",
                          animation: "spin 0.7s linear infinite", flexShrink: 0,
                        }} />
                        {t("Sending…", "جاري الإرسال...")}
                      </>
                    ) : (
                      <>
                        {t("Send Message", "إرسال الرسالة")}
                        <Send style={{ width: 15, height: 15 }} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Reveal>

          {/* ── Right: Social + Location ─────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            <Reveal delay={160}>
              <p style={{
                fontSize: "11px", fontWeight: 700, letterSpacing: "0.18em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "14px",
              }}>
                {t("Connect with me", "تواصل معي")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {SOCIALS.map((s) => <SocialCard key={s.id} s={s} />)}
              </div>
            </Reveal>

            <Reveal delay={240}>
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "14px",
                padding: "16px 18px", borderRadius: "14px",
                background: "rgba(10,15,24,0.5)", border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <MapPin style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2, color: "hsl(188 86% 53% / 0.7)" }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
                    {t("Alexandria, Egypt", "الإسكندرية، مصر")}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>
                    {t("Open to Remote", "متاح للعمل عن بعد")}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
