import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Signature } from "@/components/ui/Signature";

// ── English data ──────────────────────────────────────────────────────────────
const navLinksEN = [
  { label: "Home",     href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "About",    href: "/about" },
  { label: "Contact",  href: "/contact" },
];

const servicesEN = [
  "PCB Design & Layout",
  "Embedded Systems",
  "AI Applications",
  "Electronic Warfare",
  "Signal Security",
];

// ── Arabic data ───────────────────────────────────────────────────────────────
const navLinksAR = [
  { label: "الرئيسية",     href: "/" },
  { label: "المشاريع",     href: "/projects" },
  { label: "من نحن",      href: "/about" },
  { label: "اتصل بنا",   href: "/contact" },
];

const servicesAR = [
  "تصميم PCB والدوائر المتكاملة",
  "الأنظمة المدمجة والبرمجيات",
  "تطبيقات الذكاء الاصطناعي",
  "الحرب الإلكترونية",
  "تأمين الإشارات والاتصالات",
];

// ── Shared socials ─────────────────────────────────────────────────────────────
const socials = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/fares-salah-eng",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    label: "GitHub",
    href: "https://github.com/infinitytech-dev",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden>
        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
      </svg>
    ),
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/201000000000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="17" height="17" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:admin.infinity.tech@gmail.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" width="17" height="17" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ── Shared chevron ────────────────────────────────────────────────────────────
function ChevronLink({ href, children, isRTL }: { href: string; children: React.ReactNode; isRTL: boolean }) {
  return (
    <li>
      <Link
        href={href}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexDirection: isRTL ? "row-reverse" : "row",
          justifyContent: isRTL ? "flex-end" : "flex-start",
          fontSize: 13,
          color: "rgba(255,255,255,0.45)",
          textDecoration: "none",
          transition: "color 0.2s ease",
          lineHeight: 1.6,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "hsl(188 86% 53%)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
      >
        <svg
          width="10" height="10" viewBox="0 0 24 24" fill="none"
          stroke="hsl(188 86% 53%)" strokeWidth="2.5" strokeLinecap="round"
          style={{ opacity: 0.6, flexShrink: 0, transform: isRTL ? "rotate(180deg)" : undefined }}
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        {children}
      </Link>
    </li>
  );
}

// ── Service item ──────────────────────────────────────────────────────────────
function ServiceItem({ label, isRTL }: { label: string; isRTL: boolean }) {
  return (
    <li style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: isRTL ? "flex-end" : "flex-start",
      fontSize: 13,
      color: "rgba(255,255,255,0.45)",
      lineHeight: 1.7,
    }}>
      <span style={{
        width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
        background: "hsl(188 86% 53% / 0.6)",
      }}/>
      {label}
    </li>
  );
}

// ── Column heading ────────────────────────────────────────────────────────────
function ColHead({ children, isRTL }: { children: React.ReactNode; isRTL: boolean }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{
        fontSize: 10,
        letterSpacing: isRTL ? "0.05em" : "0.18em",
        fontWeight: 700,
        textTransform: isRTL ? undefined : "uppercase",
        color: "rgba(255,255,255,0.3)",
        margin: 0,
        textAlign: isRTL ? "right" : "left",
        fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined,
      }}>
        {children}
      </p>
      <div style={{
        marginTop: 8,
        width: 20,
        height: 1.5,
        borderRadius: 2,
        background: "linear-gradient(90deg, hsl(188 86% 53% / 0.7), transparent)",
        marginLeft: isRTL ? "auto" : undefined,
        transform: isRTL ? "scaleX(-1)" : undefined,
      }}/>
    </div>
  );
}

// ── Main footer ───────────────────────────────────────────────────────────────
export function Footer() {
  const { isRTL, lang } = useLanguage();

  const navLinks = isRTL ? navLinksAR : navLinksEN;
  const services  = isRTL ? servicesAR : servicesEN;

  return (
    <footer
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        position: "relative",
        background: "rgba(10,14,19,0.97)",
        backdropFilter: "blur(15px)",
        WebkitBackdropFilter: "blur(15px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        marginTop: "auto",
        overflow: "hidden",
        fontFamily: isRTL
          ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif"
          : "'Inter', sans-serif",
      }}
    >
      {/* Top accent gradient */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.3) 50%, transparent)",
        pointerEvents: "none",
      }}/>

      {/* Watermark */}
      <div aria-hidden style={{
        pointerEvents: "none",
        userSelect: "none",
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}>
        <span style={{
          fontSize: "clamp(3.5rem,12vw,9rem)",
          fontWeight: 900,
          letterSpacing: "-0.04em",
          whiteSpace: "nowrap",
          color: "rgba(34,211,238,0.025)",
          WebkitTextStroke: "1.5px rgba(34,211,238,0.1)",
        }}>
          INFINITY TECH
        </span>
      </div>

      {/* ── Main grid ── */}
      <div style={{
        position: "relative",
        maxWidth: 1200,
        margin: "0 auto",
        padding: "64px 24px 48px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "40px 48px",
        }}>

          {/* ── Col 1: Brand ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start" }}>
              <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden>
                <defs>
                  <linearGradient id="fg" x1="7" y1="0" x2="41" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#22D3EE" stopOpacity="0.5"/>
                    <stop offset="0.5" stopColor="#22D3EE" stopOpacity="1"/>
                    <stop offset="1" stopColor="#22D3EE" stopOpacity="0.5"/>
                  </linearGradient>
                </defs>
                <path d="M 7 24 C 7 20 9.5 17 13.5 17 C 17.5 17 20.5 20.5 24 24 C 27.5 27.5 30.5 31 34.5 31 C 38.5 31 41 28 41 24 C 41 20 38.5 17 34.5 17 C 30.5 17 27.5 20.5 24 24 C 20.5 27.5 17.5 31 13.5 31 C 9.5 31 7 28 7 24 Z" stroke="url(#fg)" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span style={{
                fontSize: 15, fontWeight: 800, letterSpacing: "0.07em",
                color: "#e2e8f0",
                fontFamily: "'Space Grotesk', sans-serif",
              }}>
                INFINITY<span style={{ color: "hsl(188 86% 53%)" }}>.</span>TECH
              </span>
            </div>

            {/* Bio */}
            <p style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.38)",
              lineHeight: 1.8,
              margin: 0,
              textAlign: isRTL ? "right" : "left",
              maxWidth: 260,
              marginLeft: isRTL ? "auto" : undefined,
            }}>
              {isRTL
                ? "نصمم وننفذ أنظمة إلكترونية متكاملة — من لوحات PCB عالية الدقة إلى أنظمة الذكاء الاصطناعي المدمج وحلول الاتصالات السيادية."
                : "Architecting mission-critical infrastructure through advanced Embedded Systems, Cyber-Physical Security, and Sovereign Communication Layers."}
            </p>

            {/* Socials */}
            <div style={{ display: "flex", gap: 8, justifyContent: isRTL ? "flex-end" : "flex-start", flexWrap: "wrap" }}>
              {socials.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  title={label}
                  style={{
                    width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.4)",
                    textDecoration: "none",
                    transition: "border-color 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease",
                    backdropFilter: "blur(8px)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(34,211,238,0.45)";
                    el.style.color = "hsl(188 86% 53%)";
                    el.style.background = "rgba(34,211,238,0.08)";
                    el.style.boxShadow = "0 0 12px rgba(34,211,238,0.15)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.1)";
                    el.style.color = "rgba(255,255,255,0.4)";
                    el.style.background = "rgba(255,255,255,0.04)";
                    el.style.boxShadow = "none";
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* ── Col 2: Services / الخدمات ── */}
          <div>
            <ColHead isRTL={isRTL}>{isRTL ? "الخدمات" : "Services"}</ColHead>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {services.map(s => (
                <ServiceItem key={s} label={s} isRTL={isRTL} />
              ))}
            </ul>
          </div>

          {/* ── Col 3: Quick links / روابط سريعة ── */}
          <div>
            <ColHead isRTL={isRTL}>{isRTL ? "روابط سريعة" : "Explore"}</ColHead>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {navLinks.map(({ label, href }) => (
                <ChevronLink key={href} href={href} isRTL={isRTL}>{label}</ChevronLink>
              ))}
            </ul>
          </div>

          {/* ── Col 4: Contact / تواصل معنا ── */}
          <div>
            <ColHead isRTL={isRTL}>{isRTL ? "تواصل معنا" : "Get In Touch"}</ColHead>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <a
                href="mailto:admin.infinity.tech@gmail.com"
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  flexDirection: isRTL ? "row-reverse" : "row",
                  color: "rgba(255,255,255,0.4)", textDecoration: "none",
                  fontSize: 13, transition: "color 0.2s ease",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "hsl(188 86% 53%)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="hsl(188 86% 53%)" strokeWidth="1.75">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,6 12,13 2,6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ wordBreak: "break-all" }}>admin.infinity.tech@gmail.com</span>
              </a>

              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                flexDirection: isRTL ? "row-reverse" : "row",
                fontSize: 13, color: "rgba(255,255,255,0.4)",
              }}>
                <svg viewBox="0 0 24 24" fill="none" width="15" height="15" stroke="hsl(188 86% 53%)" strokeWidth="1.75">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{isRTL ? "الإسكندرية، مصر" : "Alexandria, Egypt"}</span>
              </div>

              <Link
                href="/contact"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  marginTop: 4,
                  padding: "8px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(34,211,238,0.35)",
                  background: "rgba(34,211,238,0.06)",
                  color: "hsl(188 86% 53%)",
                  fontSize: 13, fontWeight: 600,
                  textDecoration: "none",
                  backdropFilter: "blur(10px)",
                  transition: "background 0.2s ease, box-shadow 0.2s ease",
                  alignSelf: isRTL ? "flex-end" : "flex-start",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(34,211,238,0.14)";
                  el.style.boxShadow = "0 0 18px rgba(34,211,238,0.2)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "rgba(34,211,238,0.06)";
                  el.style.boxShadow = "none";
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" width="13" height="13" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {isRTL ? "أرسل رسالة" : "Send a Message"}
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom bar — always LTR so signature stays on the right ── */}
      <div dir="ltr" style={{
        position: "relative",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}>
          {/* Copyright — brand name always English, trailing phrase follows language */}
          <p style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.22)",
            margin: 0,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.02em",
          }}>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
              &copy; {new Date().getFullYear()} INFINITY.TECH
            </span>
            <span style={{ fontFamily: isRTL ? "'Cairo', 'IBM Plex Sans Arabic', sans-serif" : undefined }}>
              {isRTL ? " — جميع الحقوق محفوظة." : " — All rights reserved."}
            </span>
          </p>

          {/* Signature — pinned to the right always */}
          <Signature size="sm" opacity={0.3} color="#22D3EE" rotate={-3} animate={false} />

          {/* Discreet admin access — always bottom-right */}
          <Link
            href="/admin"
            aria-label="System access"
            style={{
              position: "absolute",
              bottom: 16,
              right: 24,
              opacity: 0.1,
              transition: "opacity 0.5s ease",
              cursor: "pointer",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.35"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "0.1"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(255,255,255,0.6)" }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
