import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

// ── Constants ─────────────────────────────────────────────────────────────────
const AUTH_KEY    = "it-leads-auth";
const PIN_KEY     = "it-admin-pin";
const DEFAULT_PIN = "admin2024";
const API_BASE    = import.meta.env.VITE_API_URL || "";
const POLL_MS     = 30_000;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string;
  message: string;
  created_at: string;
}

type FilterType = "all" | "new" | "today";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${datePart}, ${timePart}`;
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Request notification permission ──────────────────────────────────────────
async function askNotifPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function fireNotif(msg: Message) {
  if (Notification.permission !== "granted") return;
  new Notification("New message — Infinity Tech", {
    body: "New Message Received",
    icon: "/favicon.svg",
    tag:  `lead-${msg.id}`,
  });
}

// ── urlBase64ToUint8Array helper ──────────────────────────────────────────────
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  const buf     = new ArrayBuffer(raw.length);
  const view    = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buf;
}

// ── PIN Gate ──────────────────────────────────────────────────────────────────
function PinGate({ onAuth }: { onAuth: (pin: string) => void }) {
  const [pin, setPin]     = useState("");
  const [show, setShow]   = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const valid = localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
    if (pin === valid) {
      sessionStorage.setItem(AUTH_KEY, pin);
      onAuth(pin);
    } else {
      setError("Incorrect PIN");
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0b1120", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "20%", width: 400, height: 400, borderRadius: "50%", background: "rgba(34,211,238,0.04)", filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "20%", width: 280, height: 280, borderRadius: "50%", background: "rgba(34,211,238,0.025)", filter: "blur(60px)" }} />
      </div>

      <div style={{
        transform: shake ? "translateX(0)" : undefined,
        animation:  shake ? "shake 0.4s ease" : undefined,
        width: "100%", maxWidth: 360, padding: "0 16px",
      }}>
        <div style={{
          background: "rgba(12,20,35,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(34,211,238,0.12)",
          borderRadius: 20,
          padding: "36px 32px",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <div style={{ position: "absolute", inset: -4, borderRadius: 16, background: "rgba(34,211,238,0.15)", filter: "blur(16px)" }} />
              <div style={{ position: "relative", width: 56, height: 56, borderRadius: 14, background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="30" height="30" viewBox="0 0 48 48" fill="none">
                  <defs>
                    <linearGradient id="pg" x1="7" y1="0" x2="41" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor="#22D3EE" stopOpacity="0.5"/>
                      <stop offset="0.5" stopColor="#22D3EE" stopOpacity="1"/>
                      <stop offset="1" stopColor="#22D3EE" stopOpacity="0.5"/>
                    </linearGradient>
                  </defs>
                  <path d="M 7 24 C 7 20 9.5 17 13.5 17 C 17.5 17 20.5 20.5 24 24 C 27.5 27.5 30.5 31 34.5 31 C 38.5 31 41 28 41 24 C 41 20 38.5 17 34.5 17 C 30.5 17 27.5 20.5 24 24 C 20.5 27.5 17.5 31 13.5 31 C 9.5 31 7 28 7 24 Z" stroke="url(#pg)" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#e2e8f0", letterSpacing: "0.08em", fontFamily: "'Space Grotesk', sans-serif" }}>
              INFINITY<span style={{ color: "hsl(188 86% 53%)" }}>.</span>TECH
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>Leads Dashboard</p>
          </div>

          {/* Auth notice */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 22 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(188 86% 53%)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              Restricted — Authorized personnel only
            </p>
          </div>

          <form onSubmit={submit}>
            <input type="text" name="username" value="admin" autoComplete="username" readOnly style={{ position: "absolute", opacity: 0, pointerEvents: "none" }} tabIndex={-1} />
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                Admin PIN
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={show ? "text" : "password"}
                  value={pin}
                  onChange={e => { setPin(e.target.value); setError(""); }}
                  placeholder="••••••••"
                  maxLength={20}
                  autoComplete="current-password"
                  autoFocus
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, padding: "11px 40px 11px 14px",
                    color: "#e2e8f0", fontSize: 14, fontFamily: "monospace",
                    letterSpacing: "0.15em", outline: "none",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.4)"; }}
                  onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                />
                <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {show
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                  </svg>
                </button>
              </div>
            </div>
            {error && (
              <p style={{ fontSize: 11, color: "#f87171", marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {error}
              </p>
            )}
            <button
              type="submit"
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "hsl(188 86% 53%)", color: "#0b1120", fontWeight: 700, fontSize: 14, cursor: "pointer", transition: "box-shadow 0.2s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px rgba(34,211,238,0.4)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              Access Dashboard
            </button>
          </form>
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 20 }}>
            Default PIN: <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>admin2024</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// ── Confirm Delete Modal ───────────────────────────────────────────────────────
function ConfirmModal({
  name, isDeleting, onConfirm, onCancel, isRTL, t,
}: {
  name: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRTL: boolean;
  t: (en: string, ar: string) => string;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        dir={isRTL ? "rtl" : "ltr"}
        style={{
          background: "rgba(12,18,32,0.97)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: 18,
          padding: "28px 28px 24px",
          maxWidth: 360, width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(248,113,113,0.1)",
          animation: "slideUp 0.2s ease",
        }}
      >
        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </div>
        </div>

        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "#e2e8f0", textAlign: "center", fontFamily: "'Space Grotesk', sans-serif" }}>
          {t("Delete Message", "حذف الرسالة")}
        </h3>
        <p style={{ margin: "0 0 22px", fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center", lineHeight: 1.6 }}>
          {t(`Are you sure you want to delete the message from`, `هل أنت متأكد من حذف رسالة`)}
          {" "}<strong style={{ color: "rgba(255,255,255,0.75)" }}>{name}</strong>{"?"}
          <br />
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {t("This action cannot be undone.", "لا يمكن التراجع عن هذا الإجراء.")}
          </span>
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "background 0.18s ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
          >
            {t("Cancel", "إلغاء")}
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(248,113,113,0.35)",
              background: isDeleting ? "rgba(248,113,113,0.06)" : "rgba(248,113,113,0.12)",
              color: "#f87171", fontSize: 13, fontWeight: 700, cursor: isDeleting ? "not-allowed" : "pointer",
              fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background 0.18s ease, box-shadow 0.18s ease",
            }}
            onMouseEnter={e => { if (!isDeleting) { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.2)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(248,113,113,0.2)"; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.12)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
          >
            {isDeleting ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {t("Deleting…", "جارٍ الحذف…")}
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                {t("Delete", "حذف")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message Card ──────────────────────────────────────────────────────────────
function MessageCard({
  msg, isNew, onDeleteRequest, t,
}: {
  msg: Message;
  isNew: boolean;
  onDeleteRequest: () => void;
  t: (en: string, ar: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [delHover, setDelHover] = useState(false);

  return (
    <div style={{
      background: "rgba(12,20,35,0.75)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: `1px solid ${isNew ? "rgba(34,211,238,0.28)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 16,
      padding: "18px 20px",
      boxShadow: isNew ? "0 0 0 1px rgba(34,211,238,0.12), 0 0 22px rgba(34,211,238,0.06)" : "none",
      transition: "border-color 0.3s ease",
      position: "relative",
    }}>
      {/* ── Top row: avatar + name + time + DELETE ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        {/* Avatar */}
        <div style={{
          width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
          background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 700, color: "hsl(188 86% 53%)",
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {msg.name.charAt(0).toUpperCase()}
        </div>

        {/* Name + contact */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>
              {msg.name}
            </p>
            {isNew && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "hsl(188 86% 53%)",
                background: "rgba(34,211,238,0.12)", borderRadius: 4, padding: "2px 6px",
              }}>
                {t("New", "جديد")}
              </span>
            )}
          </div>
          <p style={{
            fontSize: 11, color: "rgba(255,255,255,0.32)", margin: "3px 0 0",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {msg.phone ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#25D366" style={{ flexShrink: 0 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {msg.phone}
              </>
            ) : (
              msg.email ?? "—"
            )}
          </p>
        </div>

        {/* Time-since + Delete button */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", whiteSpace: "nowrap" }}>
            {timeSince(msg.created_at)}
          </span>
          <button
            onClick={onDeleteRequest}
            title={t("Delete message", "حذف الرسالة")}
            onMouseEnter={() => setDelHover(true)}
            onMouseLeave={() => setDelHover(false)}
            style={{
              width: 30, height: 30, borderRadius: 8, border: "none",
              background: delHover ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.04)",
              color: delHover ? "#f87171" : "rgba(255,255,255,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.18s ease, color 0.18s ease",
              flexShrink: 0,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Subject */}
      <p style={{ fontSize: 12, fontWeight: 600, color: "hsl(188 86% 53% / 0.82)", marginBottom: 7, marginTop: 0 }}>
        {msg.subject}
      </p>

      {/* Message body */}
      <p style={{
        fontSize: 13, color: "rgba(255,255,255,0.52)", lineHeight: 1.65, margin: 0,
        display: "-webkit-box", WebkitLineClamp: expanded ? undefined : 3,
        WebkitBoxOrient: "vertical", overflow: expanded ? "visible" : "hidden",
      }}>
        {msg.message}
      </p>

      {/* Footer row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", flexShrink: 0 }}>
          {fmtDate(msg.created_at)}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {msg.message.length > 120 && (
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ fontSize: 11, color: "hsl(188 86% 53%)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600, fontFamily: "inherit" }}
            >
              {expanded ? t("Show less", "عرض أقل") : t("Read more", "اقرأ المزيد")}
            </button>
          )}
          {msg.phone && (
            <a
              href={`https://wa.me/${msg.phone.replace(/[\s\-().]/g, "")}?text=${encodeURIComponent(`مرحباً ${msg.name}،\nأنا المهندس فارس صلاح من Infinity Tech.\nبخصوص رسالتك: "${msg.subject}"\n\n`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12, fontWeight: 700, padding: "5px 12px", borderRadius: 8,
                background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)",
                color: "rgba(37,211,102,0.7)", textDecoration: "none",
                display: "inline-flex", alignItems: "center", gap: 5,
                transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(37,211,102,0.14)";
                el.style.borderColor = "rgba(37,211,102,0.45)";
                el.style.color = "#25D366";
                el.style.boxShadow = "0 0 14px rgba(37,211,102,0.2)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "rgba(37,211,102,0.08)";
                el.style.borderColor = "rgba(37,211,102,0.2)";
                el.style.color = "rgba(37,211,102,0.7)";
                el.style.boxShadow = "none";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t("Reply via WhatsApp", "رد عبر واتساب")}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const { t, isRTL } = useLanguage();

  const [messages, setMessages]     = useState<Message[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [newIds, setNewIds]         = useState<Set<number>>(new Set());
  const [lastCount, setLastCount]   = useState(0);
  const [filter, setFilter]         = useState<FilterType>("all");
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [notifPerm, setNotifPerm]   = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const seenIds = useRef<Set<number>>(new Set());

  // ── Web Push ─────────────────────────────────────────────────────────────────
  type PushStatus = "unsupported" | "idle" | "subscribing" | "subscribed" | "unsubscribing" | "error";
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");
  const [pushMsg, setPushMsg]       = useState("");
  const activeSub                   = useRef<globalThis.PushSubscription | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }
    // Always register the SW first so serviceWorker.ready resolves reliably,
    // then check whether a push subscription already exists.
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => navigator.serviceWorker.ready)
      .then(reg => reg.pushManager.getSubscription())
      .then(sub => {
        if (sub) { activeSub.current = sub; setPushStatus("subscribed"); }
        // else: pushStatus stays "idle"; button visibility is gated on notifPerm below
      })
      .catch(() => {});
  }, []);

  async function subscribePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushStatus("subscribing");
    setPushMsg("");
    try {
      const keyRes = await fetch(`${API_BASE}/api/push/vapid-public-key`);
      if (!keyRes.ok) throw new Error("Could not fetch VAPID key");
      const { publicKey } = await keyRes.json();

      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;

      let perm = Notification.permission;
      if (perm === "default") perm = await Notification.requestPermission();
      setNotifPerm(perm);
      if (perm !== "granted") throw new Error("Notification permission denied");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      activeSub.current = sub;

      const saveRes = await fetch(`${API_BASE}/api/push/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-pin": pin },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!saveRes.ok) throw new Error("Failed to save subscription");

      setPushStatus("subscribed");
      setPushMsg(t("Push notifications enabled!", "تم تفعيل الإشعارات!"));
      setTimeout(() => setPushMsg(""), 4000);
    } catch (err: any) {
      setPushStatus("error");
      setPushMsg(err.message || "Push setup failed");
      setTimeout(() => { setPushStatus("idle"); setPushMsg(""); }, 5000);
    }
  }

  async function unsubscribePush() {
    if (!activeSub.current) return;
    setPushStatus("unsubscribing");
    try {
      const endpoint = activeSub.current.endpoint;
      await activeSub.current.unsubscribe();
      activeSub.current = null;
      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-admin-pin": pin },
        body: JSON.stringify({ endpoint }),
      });
      setPushStatus("idle");
      setPushMsg(t("Push notifications disabled", "تم إيقاف الإشعارات"));
      setTimeout(() => setPushMsg(""), 3000);
    } catch {
      setPushStatus("subscribed");
      setPushMsg(t("Failed to unsubscribe", "فشل إلغاء الاشتراك"));
      setTimeout(() => setPushMsg(""), 3000);
    }
  }

  // If permission was already granted (e.g. a previous session) but no active
  // subscription exists, silently re-subscribe — no prompt shown to the user.
  useEffect(() => {
    if (pushStatus === "idle" && Notification.permission === "granted") {
      subscribePush();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pushStatus]);

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/messages?pin=${encodeURIComponent(pin)}`);
      if (!res.ok) throw new Error("Fetch failed");
      const data: { messages: Message[] } = await res.json();
      const msgs = data.messages;

      const fresh: number[] = [];
      msgs.forEach(m => {
        if (!seenIds.current.has(m.id)) {
          fresh.push(m.id);
          seenIds.current.add(m.id);
        }
      });

      if (lastCount === 0 && seenIds.current.size > 0) {
        setLastCount(msgs.length);
        setMessages(msgs);
        setLoading(false);
        return;
      }

      if (fresh.length > 0 && lastCount > 0) {
        setNewIds(prev => new Set([...prev, ...fresh]));
        const newest = msgs.find(m => m.id === fresh[0]);
        if (newest) fireNotif(newest);
      }

      setLastCount(msgs.length);
      setMessages(msgs);
      setError("");
    } catch {
      setError(t("Could not reach the server. Retrying…", "تعذّر الاتصال بالخادم. جارٍ إعادة المحاولة…"));
    } finally {
      setLoading(false);
    }
  }, [pin, lastCount, t]);

  useEffect(() => { fetchMessages(); }, []);
  useEffect(() => {
    const id = setInterval(() => fetchMessages(true), POLL_MS);
    return () => clearInterval(id);
  }, [fetchMessages]);

  // ── Delete handler ────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/messages/${deleteTarget.id}?pin=${encodeURIComponent(pin)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Delete failed");
      setMessages(prev => prev.filter(m => m.id !== deleteTarget.id));
      setNewIds(prev => { const next = new Set(prev); next.delete(deleteTarget.id); return next; });
      seenIds.current.delete(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // Silent — modal stays open
    } finally {
      setIsDeleting(false);
    }
  }

  // ── Filtered messages ─────────────────────────────────────────────────────
  const todayStr = new Date().toDateString();
  const filteredMessages = useMemo(() => {
    switch (filter) {
      case "new":   return messages.filter(m => newIds.has(m.id));
      case "today": return messages.filter(m => new Date(m.created_at).toDateString() === todayStr);
      default:      return messages;
    }
  }, [messages, filter, newIds, todayStr]);

  const filterLabels: { key: FilterType; en: string; ar: string; count: number }[] = [
    { key: "all",   en: "All",   ar: "الكل",   count: messages.length },
    { key: "new",   en: "New",   ar: "جديد",   count: newIds.size },
    { key: "today", en: "Today", ar: "اليوم",  count: messages.filter(m => new Date(m.created_at).toDateString() === todayStr).length },
  ];

  return (
    <div dir={isRTL ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: "#0b1120", fontFamily: "'Inter', sans-serif" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "70%", height: "50vh", background: "radial-gradient(ellipse at top, rgba(34,211,238,0.05) 0%, transparent 70%)" }} />
      </div>

      {/* ── Sticky Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(11,17,32,0.9)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 20px",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        {/* Left: Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="hg" x1="7" y1="0" x2="41" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#22D3EE" stopOpacity="0.5"/>
                <stop offset="0.5" stopColor="#22D3EE" stopOpacity="1"/>
                <stop offset="1" stopColor="#22D3EE" stopOpacity="0.5"/>
              </linearGradient>
            </defs>
            <path d="M 7 24 C 7 20 9.5 17 13.5 17 C 17.5 17 20.5 20.5 24 24 C 27.5 27.5 30.5 31 34.5 31 C 38.5 31 41 28 41 24 C 41 20 38.5 17 34.5 17 C 30.5 17 27.5 20.5 24 24 C 20.5 27.5 17.5 31 13.5 31 C 9.5 31 7 28 7 24 Z" stroke="url(#hg)" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", letterSpacing: "0.06em", fontFamily: "'Space Grotesk', sans-serif" }}>
            INFINITY<span style={{ color: "hsl(188 86% 53%)" }}>.</span>TECH
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 500, display: "none" }}>
            {t("Leads", "الرسائل")}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", display: "none" }}>
            {messages.length}
          </span>

          {/* Push control
              — subscribed          → green "Push on" pill (click to turn off)
              — subscribing/unsub   → spinner
              — error               → red retry button
              — idle + default perm → cyan "Enable Notifications" button (one-time, disappears after grant)
              — idle + granted perm → silent auto-subscribe running; show nothing
              — idle + denied perm  → nothing the user can do; hide
              — unsupported         → nothing                                            */}
          {pushStatus === "subscribed" ? (
            <button
              onClick={unsubscribePush}
              title={t("Disable push notifications", "إيقاف الإشعارات")}
              style={{ background: "rgba(37,211,102,0.07)", border: "1px solid rgba(37,211,102,0.22)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", color: "rgba(37,211,102,0.8)", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, transition: "background 0.18s ease, color 0.18s ease, border-color 0.18s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(248,113,113,0.3)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(37,211,102,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(37,211,102,0.22)"; (e.currentTarget as HTMLElement).style.color = "rgba(37,211,102,0.8)"; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              {t("Push on", "الإشعارات")}
            </button>
          ) : pushStatus === "subscribing" || pushStatus === "unsubscribing" ? (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 9px" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              {pushStatus === "subscribing" ? t("Enabling…", "جارٍ التفعيل…") : t("Disabling…", "جارٍ الإيقاف…")}
            </span>
          ) : pushStatus === "error" ? (
            <button
              onClick={subscribePush}
              title={t("Push setup failed — tap to retry", "فشل الإعداد — انقر للمحاولة")}
              style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", color: "rgba(248,113,113,0.8)", display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600 }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {t("Retry", "إعادة")}
            </button>
          ) : pushStatus === "idle" && notifPerm === "default" ? (
            /* One-time "Enable Notifications" button — only visible when permission
               has NEVER been asked. Disappears permanently once the user taps Allow. */
            <button
              onClick={subscribePush}
              title={t("Enable push notifications — one-time setup", "تفعيل الإشعارات — إعداد لمرة واحدة")}
              style={{
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.28)",
                borderRadius: 8, padding: "5px 11px",
                cursor: "pointer",
                color: "hsl(188 86% 53%)",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, fontWeight: 700,
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                boxShadow: "0 0 0 1px rgba(34,211,238,0.08) inset",
                transition: "background 0.18s ease, box-shadow 0.18s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.15)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px rgba(34,211,238,0.2)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.08)";
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 1px rgba(34,211,238,0.08) inset";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {t("Enable Notifications", "تفعيل الإشعارات")}
            </button>
          ) : null}

          {/* Refresh */}
          <button
            onClick={() => fetchMessages(true)}
            title={t("Refresh", "تحديث")}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 9px", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", transition: "background 0.18s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(34,211,238,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>

          {/* Sign out */}
          <button
            onClick={onLogout}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, fontFamily: "inherit", transition: "background 0.18s ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.1)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"; }}
          >
            {t("Sign out", "خروج")}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 56px" }}>

        {/* Stats row */}
        {!loading && !error && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label: t("Total", "المجموع"),  value: messages.length },
              { label: t("New", "جديد"),        value: newIds.size },
              { label: t("Today", "اليوم"),    value: messages.filter(m => new Date(m.created_at).toDateString() === todayStr).length },
            ].map(s => (
              <div key={s.label} style={{
                background: "rgba(12,20,35,0.7)",
                backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "14px 16px", textAlign: "center",
              }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: "hsl(188 86% 53%)", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "3px 0 0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter pills ── */}
        {!loading && !error && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {filterLabels.map(f => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 10,
                    background: active ? "rgba(34,211,238,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "rgba(34,211,238,0.3)" : "rgba(255,255,255,0.07)"}`,
                    color: active ? "hsl(188 86% 53%)" : "rgba(255,255,255,0.4)",
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                    backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                    boxShadow: active ? "0 0 12px rgba(34,211,238,0.1)" : "none",
                    transition: "background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease",
                  } as React.CSSProperties}
                >
                  {t(f.en, f.ar)}
                  <span style={{
                    fontSize: 10, fontWeight: 700, minWidth: 18, height: 18,
                    background: active ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.07)",
                    color: active ? "hsl(188 86% 53%)" : "rgba(255,255,255,0.35)",
                    borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px",
                  }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid rgba(34,211,238,0.2)", borderTopColor: "hsl(188 86% 53%)", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
            {t("Loading messages…", "جارٍ تحميل الرسائل…")}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: "16px 20px", color: "#f87171", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredMessages.length === 0 && (
          <div style={{ textAlign: "center", padding: "70px 0", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: "0 auto 14px", display: "block", opacity: 0.3 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {filter === "all"
              ? t("No messages yet. Share your contact page!", "لا توجد رسائل بعد. شارك صفحة التواصل!")
              : t("No messages match this filter.", "لا توجد رسائل لهذا الفلتر.")}
          </div>
        )}

        {/* Message list */}
        {!loading && filteredMessages.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredMessages.map(m => (
              <MessageCard
                key={m.id}
                msg={m}
                isNew={newIds.has(m.id)}
                onDeleteRequest={() => setDeleteTarget(m)}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Auto-refresh hint */}
        {!loading && !error && messages.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.14)", marginTop: 28 }}>
            {t("Auto-refreshes every 30 seconds", "يتحدث تلقائياً كل 30 ثانية")}
          </p>
        )}
      </main>

      {/* ── Push toast ── */}
      {pushMsg && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000,
          background: pushStatus === "error" ? "rgba(248,113,113,0.15)" : "rgba(12,20,35,0.94)",
          border: `1px solid ${pushStatus === "error" ? "rgba(248,113,113,0.35)" : "rgba(34,211,238,0.25)"}`,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderRadius: 12, padding: "12px 20px",
          color: pushStatus === "error" ? "#f87171" : "hsl(188 86% 53%)",
          fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          whiteSpace: "nowrap",
          animation: "fadeInUp 0.25s ease",
        }}>
          {pushStatus === "error"
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          }
          {pushMsg}
        </div>
      )}

      {/* ── Confirm Delete Modal ── */}
      {deleteTarget && (
        <ConfirmModal
          name={deleteTarget.name}
          isDeleting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => { if (!isDeleting) setDeleteTarget(null); }}
          isRTL={isRTL}
          t={t}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function AdminInfinity() {
  const [pin, setPin] = useState<string | null>(() => {
    const cached = sessionStorage.getItem(AUTH_KEY);
    if (!cached) return null;
    const valid = localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
    return cached === valid ? cached : null;
  });

  function handleLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    setPin(null);
  }

  if (!pin) return <PinGate onAuth={p => setPin(p)} />;
  return <Dashboard pin={pin} onLogout={handleLogout} />;
}
