import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Language = "en" | "ar";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  /** true when Arabic is active — used for font/text-align switching, NOT layout direction */
  isRTL: boolean;
  isTransitioning: boolean;
  /**
   * Pick the right language string (or any ReactNode).
   * Works for plain strings AND JSX fragments with styled spans.
   *
   * t("View Details", "عرض التفاصيل")
   * t(<>Projects <span className="text-primary">&</span> Research</>, <>المشاريع</>)
   */
  t: <T extends ReactNode>(en: T, ar: T) => T;
  /**
   * CSS class to apply to translated text containers.
   * Adds direction, text-align, and the correct typeface for the active language.
   *
   * "ar-text" → direction:rtl, text-align:right, Cairo font
   * "en-text" → direction:ltr, text-align:left,  Inter font
   *
   * Usage:  <p className={`text-muted-foreground ${textClass}`}>{t(en, ar)}</p>
   */
  textClass: "ar-text" | "en-text";
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ar",
  setLang: () => {},
  isRTL: true,
  isTransitioning: false,
  t: (_en, ar) => ar,
  textClass: "ar-text",
});

const TRANSITION_MS = 160;

export function LanguageProvider({ children }: { children: ReactNode }) {
  /*
   * Default language is Arabic.
   * Layout is ALWAYS LTR — Arabic is handled via font + per-element text-align,
   * not by flipping the global layout direction.
   */
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("it-lang") as Language | null;
    return stored || "ar";
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  /** Convenience alias — means "Arabic is active", NOT "layout is RTL" */
  const isRTL = lang === "ar";

  useEffect(() => {
    const root = document.documentElement; // <html>
    const body = document.body;

    /*
     * Layout direction: ALWAYS ltr on <html>.
     * The page structure never flips — only text elements inside
     * .lang-ar get direction:rtl via the global CSS rules in index.css.
     */
    root.setAttribute("dir", "ltr");

    /*
     * lang attribute benefits screen readers and SEO crawlers.
     */
    root.setAttribute("lang", lang);

    /*
     * Global language class on <body> — drives the .lang-ar / .lang-en
     * CSS rules that apply font, direction, and text-align to all prose
     * elements site-wide without any per-component class additions.
     */
    body.classList.remove("lang-en", "lang-ar");
    body.classList.add(lang === "ar" ? "lang-ar" : "lang-en");

    localStorage.setItem("it-lang", lang);
  }, [lang]);

  /** Fade content out → swap language → fade back in */
  const setLang = useCallback(
    (l: Language) => {
      if (l === lang) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setLangState(l);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => setIsTransitioning(false))
        );
      }, TRANSITION_MS);
    },
    [lang],
  );

  const textClass = lang === "ar" ? "ar-text" : "en-text";

  function t<T extends ReactNode>(en: T, ar: T): T {
    return lang === "ar" ? ar : en;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRTL, isTransitioning, t, textClass }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
