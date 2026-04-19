import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import {
  LayoutDashboard, FolderOpen, BarChart2, Settings,
  Sun, Moon, LogOut, ChevronLeft, ChevronRight,
  Cpu, ExternalLink, MessageSquare, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";

function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    async function load() {
      try {
        const data = await adminApi.get<{ unreadCount: number }>("/notifications");
        setCount(data.unreadCount);
      } catch { /* silent */ }
    }
    void load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);
  return count;
}

const NAV_ITEMS = [
  { href: "/admin",                 label: "Dashboard",     icon: LayoutDashboard },
  { href: "/admin/projects",        label: "Projects",      icon: FolderOpen },
  { href: "/admin/analytics",       label: "Analytics",     icon: BarChart2 },
  { href: "/admin/comments",        label: "Comments",      icon: MessageSquare },
  { href: "/admin/notifications",   label: "Notifications", icon: Bell, badge: true },
  { href: "/admin/settings",        label: "Settings",      icon: Settings },
];

interface SidebarProps { onLogout: () => void; }

export default function AdminSidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const unreadCount = useUnreadCount();

  const isActive = (href: string) =>
    href === "/admin"
      ? location === "/admin" || location === "/admin/"
      : location.startsWith(href);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="relative flex flex-col h-screen shrink-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(9,13,20,0.97) 0%, rgba(10,16,25,0.95) 100%)",
        borderRight: "1px solid rgba(34, 211, 238, 0.08)",
        backdropFilter: "blur(16px)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.35)",
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 py-5 border-b shrink-0",
        collapsed ? "px-4 justify-center" : "px-4",
        "border-white/6"
      )}>
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-xl bg-primary/20 blur-lg animate-pulse" />
          <div className="relative w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Cpu className="w-[18px] h-[18px] text-primary" />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden leading-none"
            >
              <p className="text-[13px] font-black tracking-[0.08em] text-foreground font-display whitespace-nowrap">
                INFINITY<span className="text-primary">.</span>TECH
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 tracking-[0.2em] uppercase whitespace-nowrap">
                Admin Panel
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status badge */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-b border-white/5"
          >
            <div className="flex items-center gap-2 px-4 py-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-chart-4 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-chart-4" />
              </span>
              <span className="text-xs text-muted-foreground">System Online</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => {
          const active = isActive(href);
          const badgeCount = badge ? unreadCount : 0;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 2 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group",
                  active
                    ? "text-primary bg-primary/8 border border-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/4 border border-transparent"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="admin-active-bar"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full"
                    style={{ boxShadow: "0 0 8px hsl(188 86% 53% / 0.7)" }}
                  />
                )}
                <div className="relative shrink-0">
                  <Icon className={cn("w-4 h-4", active && "drop-shadow-[0_0_6px_hsl(188_86%_53%/0.6)]")} />
                  {badgeCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-primary text-[9px] font-bold text-black flex items-center justify-center px-0.5">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && badgeCount > 0 && (
                  <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
                    {badgeCount}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="px-2 py-3 space-y-1 border-t border-white/5">
        <Link href="/" target="_blank">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground/60 hover:text-muted-foreground hover:bg-white/4 border border-transparent cursor-pointer transition-all duration-200",
            collapsed && "justify-center"
          )}>
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">View Site</span>}
          </div>
        </Link>

        <button
          onClick={toggleTheme}
          title={collapsed ? (theme === "dark" ? "Light Mode" : "Dark Mode") : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/4 border border-transparent transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.span key="sun" initial={{ rotate: -90, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: 90, scale: 0.7 }} transition={{ duration: 0.18 }}>
                <Sun className="w-4 h-4 shrink-0" />
              </motion.span>
            ) : (
              <motion.span key="moon" initial={{ rotate: 90, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} exit={{ rotate: -90, scale: 0.7 }} transition={{ duration: 0.18 }}>
                <Moon className="w-4 h-4 shrink-0" />
              </motion.span>
            )}
          </AnimatePresence>
          {!collapsed && (
            <span className="text-sm font-medium">
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>

        <button
          onClick={onLogout}
          title={collapsed ? "Logout" : undefined}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/65 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none" />

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute top-1/2 -right-3 z-20 w-6 h-6 rounded-full bg-card border border-primary/20 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/8 transition-all duration-200 shadow-lg shadow-black/30"
      >
        <AnimatePresence mode="wait" initial={false}>
          {collapsed ? (
            <motion.span key="right" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }} transition={{ duration: 0.15 }}>
              <ChevronRight className="w-3 h-3" />
            </motion.span>
          ) : (
            <motion.span key="left" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }} transition={{ duration: 0.15 }}>
              <ChevronLeft className="w-3 h-3" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </motion.aside>
  );
}
