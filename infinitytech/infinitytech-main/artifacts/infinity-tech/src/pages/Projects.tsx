import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Code, Github, Terminal, ExternalLink, X, Globe,
  ChevronRight, Tag, Cpu, Box, Zap, Layers, Hash,
} from "lucide-react";
import { useProjects } from "@/hooks/use-projects";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Project } from "@/data/projects";

// ── Category SVG icons ─────────────────────────────────────────────────────
function IconAll() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
      <rect x="2" y="2" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11.5" y="2" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="11.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="11.5" y="11.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconGripper() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
      <path d="M10 16v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7.5" y="12" width="5" height="1.5" rx="0.75" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M5 12 C3.5 12 2.5 11 2.5 9.5 L2.5 7 C2.5 6 3 5 4 4.5 L5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M15 12 C16.5 12 17.5 11 17.5 9.5 L17.5 7 C17.5 6 17 5 16 4.5 L15 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M5 4 C5 3 6 2 7.5 2 L12.5 2 C14 2 15 3 15 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="10" cy="17.5" r="1" fill="currentColor"/>
    </svg>
  );
}
function Icon3D() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
      <path d="M10 2 L18 6.5 L18 13.5 L10 18 L2 13.5 L2 6.5 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M10 2 L10 18" stroke="currentColor" strokeWidth="1.1" strokeDasharray="2 1.5"/>
      <path d="M2 6.5 L10 11 L18 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSimatic() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0">
      <rect x="3" y="5" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="5.5" y="7.5" width="3" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="10" y="7.5" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.1"/>
      <rect x="10" y="10.5" width="3" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.1"/>
      <path d="M1 8.5 H3 M17 8.5 H19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M1 11.5 H3 M17 11.5 H19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────
type FilterKey = "all" | "gripper" | "3d" | "simatic";

const CATEGORY_STYLE: Record<string, string> = {
  gripper: "text-amber-400 bg-amber-500/15 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]",
  "3d":    "text-blue-400 bg-blue-500/15 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.25)]",
  simatic: "text-violet-400 bg-violet-500/15 border-violet-500/40 shadow-[0_0_10px_rgba(139,92,246,0.25)]",
};

const CATEGORY_LABEL: Record<string, { en: string; ar: string }> = {
  gripper: { en: "Gripper",    ar: "Gripper"     },
  "3d":    { en: "3D Design",  ar: "تصميم ثلاثي"  },
  simatic: { en: "Simatic",    ar: "Simatic"      },
};

const CATEGORY_ICON: Record<string, () => React.JSX.Element> = {
  gripper: IconGripper,
  "3d":    Icon3D,
  simatic: IconSimatic,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400 bg-green-400/10 border-green-400/20",
  active:    "text-primary bg-primary/10 border-primary/20",
  archived:  "text-muted-foreground bg-muted/30 border-border",
};

const TECH_MAP: Record<string, { bg: string; text: string; label: string }> = {
  c:          { bg: "bg-sky-500/15",    text: "text-sky-400",    label: "C"        },
  cpp:        { bg: "bg-blue-600/15",   text: "text-blue-300",   label: "C++"      },
  python:     { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "Python"   },
  javascript: { bg: "bg-amber-500/15",  text: "text-amber-400",  label: "JS"       },
  typescript: { bg: "bg-blue-500/15",   text: "text-blue-400",   label: "TS"       },
  rust:       { bg: "bg-orange-500/15", text: "text-orange-400", label: "Rust"     },
  matlab:     { bg: "bg-orange-600/15", text: "text-orange-300", label: "MATLAB"   },
  verilog:    { bg: "bg-green-600/15",  text: "text-green-400",  label: "Verilog"  },
  assembly:   { bg: "bg-red-500/15",    text: "text-red-400",    label: "ASM"      },
  arduino:    { bg: "bg-teal-500/15",   text: "text-teal-400",   label: "Arduino"  },
};

const FILTERS: { key: FilterKey; en: string; ar: string; Icon: () => React.JSX.Element }[] = [
  { key: "all",     en: "All",        ar: "الكل",         Icon: IconAll     },
  { key: "gripper", en: "Gripper",    ar: "Gripper",      Icon: IconGripper },
  { key: "3d",      en: "3D Design",  ar: "تصميم ثلاثي",  Icon: Icon3D      },
  { key: "simatic", en: "Simatic",    ar: "Simatic",      Icon: IconSimatic },
];

const FILTER_ACTIVE: Record<FilterKey, string> = {
  all:     "bg-primary text-primary-foreground border-primary/50 shadow-[0_0_14px_rgba(34,211,238,0.4)]",
  gripper: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.3)]",
  "3d":    "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_14px_rgba(59,130,246,0.3)]",
  simatic: "bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-[0_0_14px_rgba(139,92,246,0.3)]",
};

// ── Project Modal ──────────────────────────────────────────────────────────
type PublicProject = NonNullable<ReturnType<typeof useProjects>["data"]>[number];

function TechBadge({ lang, size = "sm" }: { lang: string; size?: "sm" | "md" }) {
  const key = lang.toLowerCase().replace(/[^a-z]/g, "");
  const meta = TECH_MAP[key] || TECH_MAP[lang.toLowerCase()];
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono font-bold
      ${size === "md" ? "text-xs" : "text-[10px]"}
      ${meta.bg} ${meta.text} border-current/20`}>
      {meta.label}
    </span>
  );
}

function TagBadge({ tag, cat }: { tag: string; cat?: string }) {
  const isSim = cat === "simatic";
  const isGrip = cat === "gripper";
  if (isSim) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-mono font-semibold">
      <Cpu className="w-3 h-3" />{tag}
    </span>
  );
  if (isGrip) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-mono font-semibold">
      <Zap className="w-3 h-3" />{tag}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-semibold">
      <Hash className="w-3 h-3" />{tag}
    </span>
  );
}

function ProjectModal({ project, onClose }: { project: PublicProject; onClose: () => void }) {
  const { t, lang, setLang } = useLanguage();
  const catKey = (project.category ?? "").toLowerCase().trim();
  const catStyle = CATEGORY_STYLE[catKey];
  const catLabel = CATEGORY_LABEL[catKey];
  const CatIcon = CATEGORY_ICON[catKey];
  const displayTitle = t(project.title, project.titleAr || project.title);
  const displayDesc = t(project.description, project.descriptionAr || project.description);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/85 backdrop-blur-2xl" />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-card border border-border shadow-[0_0_80px_rgba(34,211,238,0.08)] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Hero image */}
          <div className="relative h-52 sm:h-64 w-full overflow-hidden rounded-t-3xl flex-shrink-0 bg-gradient-to-br from-[#1A2330] to-[#0B0F14]">
            {project.thumbnailUrl ? (
              <img
                src={project.thumbnailUrl}
                alt={displayTitle}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-20"
                style={{
                  backgroundImage: "radial-gradient(circle at 2px 2px, rgba(34,211,238,0.2) 1px, transparent 0)",
                  backgroundSize: "20px 20px",
                }}>
                <Terminal className="w-16 h-16 text-primary" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />

            {/* Category badge */}
            {catLabel && catStyle && CatIcon && (
              <div className="absolute top-4 left-4">
                <span className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] uppercase tracking-widest font-mono font-bold rounded-xl border backdrop-blur-xl ${catStyle}`}>
                  <CatIcon />
                  {t(catLabel.en, catLabel.ar)}
                </span>
              </div>
            )}

            {/* Status badge */}
            <div className="absolute bottom-4 left-4">
              <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
                {project.status.toUpperCase()}
              </span>
            </div>

            {/* 3D preview button on hero */}
            {catKey === "3d" && project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/90 backdrop-blur text-white text-xs font-bold border border-blue-400/40 hover:bg-blue-500 transition-all"
              >
                <Box className="w-3.5 h-3.5" />
                {t("3D Preview", "نموذج ثلاثي")}
              </a>
            )}
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Title + language toggle */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground leading-tight flex-1">
                {displayTitle}
              </h2>
              <div className="flex items-center bg-muted/30 border border-border rounded-lg p-0.5 text-xs font-mono font-bold flex-shrink-0">
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >EN</button>
                <button
                  onClick={() => setLang("ar")}
                  className={`px-2.5 py-1.5 rounded-md transition-all ${lang === "ar" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >عربي</button>
              </div>
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed text-sm sm:text-base" dir={lang === "ar" ? "rtl" : "ltr"}>
              {displayDesc}
            </p>

            {/* Tech Stack */}
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                {t("Tech Stack", "المجموعة التقنية")}
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Primary language badge */}
                {project.language && (
                  <TechBadge lang={project.language} size="md" />
                )}
                {/* Tags */}
                {project.tags.map(tag => (
                  <TagBadge key={tag} tag={tag} cat={catKey} />
                ))}
                {project.tags.length === 0 && !project.language && (
                  <span className="text-xs text-muted-foreground italic">No tech stack defined</span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border/50" />

            {/* Action row */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/projects/${project.id}`}
                onClick={onClose}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary border border-primary/30 hover:bg-primary hover:text-primary-foreground font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]"
              >
                {t("Full Details", "التفاصيل الكاملة")}
                <ChevronRight className="w-4 h-4" />
              </Link>

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground font-semibold text-sm transition-all duration-200"
                >
                  <Globe className="w-4 h-4" />
                  GitHub
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {project.liveUrl && catKey !== "3d" && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 font-semibold text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t("Live Demo", "عرض مباشر")}
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Projects Page ──────────────────────────────────────────────────────────
const gridVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function Projects() {
  const { data: projects, isLoading } = useProjects();
  const { t, isRTL } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [modalProject, setModalProject] = useState<PublicProject | null>(null);

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (activeFilter === "all") return projects;
    return projects.filter(p => (p.category ?? "").toLowerCase().trim() === activeFilter);
  }, [projects, activeFilter]);

  const counts = useMemo(() => {
    if (!projects) return {} as Record<FilterKey, number>;
    return {
      all:     projects.length,
      gripper: projects.filter(p => (p.category ?? "").toLowerCase() === "gripper").length,
      "3d":    projects.filter(p => (p.category ?? "").toLowerCase() === "3d").length,
      simatic: projects.filter(p => (p.category ?? "").toLowerCase() === "simatic").length,
    } satisfies Record<FilterKey, number>;
  }, [projects]);

  const openModal = useCallback((p: PublicProject) => setModalProject(p), []);
  const closeModal = useCallback(() => setModalProject(null), []);

  return (
    <>
      <div className="min-h-screen w-full pt-24 sm:pt-32 pb-16 sm:pb-24">
        <SEO
          title={t("Projects & Research", "المشاريع والبحوث")}
          description={t(
            "A comprehensive portfolio of hardware engineering work: multi-layer PCB design, embedded firmware, autonomous robotics, and edge AI systems.",
            "مجموعة متكاملة من أعمال الهندسة الإلكترونية: تصميم PCB متعددة الطبقات، البرمجيات المدمجة، الروبوتات المستقلة.",
          )}
          keywords="PCB projects, embedded systems portfolio, hardware engineering projects, robotics research"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8 sm:mb-12"
          >
            <h1
              className="fluid-h1 font-black tracking-tighter text-foreground mb-4"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t(
                <>Projects <span className="text-primary">&</span> Research</>,
                <>المشاريع <span className="text-primary">&</span> البحوث</>,
              )}
            </h1>
            <p
              className="text-lg text-muted-foreground max-w-2xl"
              style={{ textAlign: isRTL ? "right" : "left" }}
            >
              {t(
                "A comprehensive log of my engineering work across hardware design, multi-layer PCB layout, embedded firmware, and robotics systems.",
                "سجل شامل لأعمالي الهندسية في تصميم الأجهزة، تصميم لوحات PCB متعددة الطبقات، البرمجيات المدمجة، وأنظمة الروبوتات.",
              )}
            </p>
          </motion.div>

          {/* Filter navigation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1"
              style={{ direction: isRTL ? "rtl" : "ltr" }}>
              {FILTERS.map(({ key, en, ar, Icon }) => {
                const isActive = activeFilter === key;
                const count = counts[key] ?? 0;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? FILTER_ACTIVE[key]
                        : "bg-card/60 backdrop-blur-sm text-muted-foreground border-border hover:text-foreground hover:border-primary/30"
                    }`}
                  >
                    <Icon />
                    {t(en, ar)}
                    {!isLoading && (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md transition-all ${isActive ? "bg-white/20" : "bg-muted text-muted-foreground/70"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 h-px bg-border/40 rounded-full" />
          </motion.div>

          {/* Grid content */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden animate-pulse">
                  <div className="h-52 bg-muted/40" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 w-3/4 rounded bg-muted/50" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-full rounded bg-muted/35" />
                      <div className="h-3.5 w-5/6 rounded bg-muted/35" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <div className="h-6 w-16 rounded bg-muted/40" />
                      <div className="h-6 w-20 rounded bg-muted/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-24 text-center"
                  >
                    <Terminal className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-lg font-semibold text-foreground mb-2">
                      {activeFilter === "all"
                        ? t("No projects yet", "لا توجد مشاريع بعد")
                        : t(`No ${activeFilter.toUpperCase()} projects yet`, `لا توجد مشاريع في هذه الفئة بعد`)}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {t("Projects will appear here once added from the admin panel.", "ستظهر المشاريع هنا بعد إضافتها من لوحة الإدارة.")}
                    </p>
                    {activeFilter !== "all" && (
                      <button
                        onClick={() => setActiveFilter("all")}
                        className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                      >
                        {t("View all projects", "عرض كل المشاريع")}
                      </button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    variants={gridVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {filtered.map(project => {
                      const displayTitle = t(project.title, project.titleAr || project.title);
                      const displayDesc  = t(project.description, project.descriptionAr || project.description);
                      const catKey = (project.category ?? "").toLowerCase().trim();
                      const catStyle = CATEGORY_STYLE[catKey];
                      const catLabel = CATEGORY_LABEL[catKey];
                      const CatIcon = CATEGORY_ICON[catKey];

                      return (
                        <motion.div
                          key={project.id}
                          variants={cardVariants}
                          className="group flex flex-col bg-card/90 rounded-2xl border border-border hover:border-primary/40 overflow-hidden relative cursor-pointer transition-all duration-300 hover:shadow-[0_8px_40px_rgba(34,211,238,0.08)]"
                          onClick={() => openModal(project)}
                        >
                          {/* Thumbnail */}
                          <div className="h-52 w-full relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#1A2330] to-[#0B0F14]">
                            {project.thumbnailUrl ? (
                              <img
                                src={project.thumbnailUrl}
                                alt={displayTitle}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <>
                                <div
                                  className="absolute inset-0 opacity-30"
                                  style={{
                                    backgroundImage: "radial-gradient(circle at 2px 2px, rgba(34,211,238,0.15) 1px, transparent 0)",
                                    backgroundSize: "20px 20px",
                                  }}
                                />
                                <Terminal className="w-10 h-10 text-primary/30 group-hover:text-primary/50 transition-colors duration-200" />
                              </>
                            )}

                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

                            {/* Glassmorphism hover overlay */}
                            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[1px]" />

                            {/* Category badge */}
                            {catLabel && catStyle && CatIcon && (
                              <div className="absolute top-3 left-3 z-10">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-wider font-mono font-bold rounded-xl border backdrop-blur-xl ${catStyle}`}>
                                  <CatIcon />
                                  {t(catLabel.en, catLabel.ar)}
                                </span>
                              </div>
                            )}

                            {/* Status badge */}
                            <div className="absolute top-3 right-3 z-10">
                              <span className={`px-2 py-1 text-[10px] font-mono font-bold rounded border ${STATUS_COLORS[project.status] ?? STATUS_COLORS.active}`}>
                                {project.status.toUpperCase()}
                              </span>
                            </div>

                            {/* Tech tags */}
                            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 z-10">
                              {project.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono font-medium rounded bg-background/60 backdrop-blur-[8px] border border-border/80 text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* "Click to preview" hint */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                              <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/90 backdrop-blur-sm border border-primary/40 text-primary text-xs font-bold shadow-xl">
                                <Tag className="w-3.5 h-3.5" />
                                {t("Quick Preview", "معاينة سريعة")}
                              </span>
                            </div>
                          </div>

                          {/* Card body */}
                          <div className="p-5 flex flex-col flex-grow">
                            <div className="flex items-start justify-between mb-2 gap-2">
                              <h3
                                className="text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight flex-1 line-clamp-2"
                                style={{ textAlign: isRTL ? "right" : "left" }}
                              >
                                {displayTitle}
                              </h3>
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="GitHub"
                                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0 relative z-10"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Github className="w-4 h-4" />
                                </a>
                              )}
                            </div>

                            <p
                              className="text-sm text-muted-foreground flex-grow mb-5 line-clamp-2"
                              style={{ textAlign: isRTL ? "right" : "left" }}
                            >
                              {displayDesc}
                            </p>

                            {/* Actions */}
                            <div className="flex gap-2 mt-auto">
                              <button
                                onClick={e => { e.stopPropagation(); openModal(project); }}
                                className="flex-1 py-2.5 text-center text-sm font-semibold rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                              >
                                {t("View Details", "عرض التفاصيل")}
                              </button>
                              {project.liveUrl && (
                                <a
                                  href={project.liveUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={catKey === "3d" ? t("View 3D Model", "نموذج ثلاثي") : t("Live Demo", "عرض مباشر")}
                                  className="flex items-center justify-center px-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all hover:shadow-[0_0_16px_rgba(34,211,238,0.35)]"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Code"
                                  className="flex items-center justify-center px-3 rounded-xl bg-background border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Code className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalProject && (
        <ProjectModal project={modalProject} onClose={closeModal} />
      )}
    </>
  );
}
