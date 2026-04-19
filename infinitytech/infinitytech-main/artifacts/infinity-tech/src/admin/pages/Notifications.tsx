import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCheck, MessageSquare, Zap, Trash2, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { adminApi } from "@/lib/api";

interface Notification {
  id: number;
  type: string;
  projectId: string | null;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function NotifIcon({ type }: { type: string }) {
  if (type === "new_comment") {
    return (
      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <MessageSquare className="w-4 h-4 text-primary" />
      </div>
    );
  }
  if (type === "high_activity") {
    return (
      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-yellow-400" />
      </div>
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
      <Bell className="w-4 h-4 text-white/40" />
    </div>
  );
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async (markRead = false) => {
    setLoading(true); setError("");
    try {
      const data = await adminApi.get<{ notifications: Notification[]; unreadCount: number }>("/notifications");
      setNotifications(data.notifications);
      if (markRead && data.unreadCount > 0) {
        await adminApi.patch("/notifications/read-all", {});
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await adminApi.patch("/notifications/read-all", {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(id: number) {
    try {
      await adminApi.patch(`/notifications/${id}/read`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  }

  const displayed = filter === "unread" ? notifications.filter(n => !n.isRead) : notifications;
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-black flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-white">Notifications</h1>
            <p className="text-xs text-white/40">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-primary/30 text-primary bg-primary/8 hover:bg-primary/14 disabled:opacity-50 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          <button
            onClick={() => void load(false)}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/4 border border-white/6 w-fit">
        {(["all", "unread"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize ${
              filter === tab
                ? "bg-primary/20 text-primary border border-primary/30"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            {tab}
            {tab === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && displayed.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center">
            <BellOff className="w-7 h-7 text-white/20" />
          </div>
          <div className="text-center">
            <p className="text-white/50 font-medium">
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
            <p className="text-xs text-white/25 mt-1">
              {filter === "unread"
                ? "You're all caught up!"
                : "Notifications appear here when visitors comment on your projects."}
            </p>
          </div>
          {filter === "unread" && (
            <button
              onClick={() => setFilter("all")}
              className="text-xs text-primary/60 hover:text-primary transition-colors"
            >
              View all notifications
            </button>
          )}
        </motion.div>
      )}

      {/* Notification list */}
      <AnimatePresence mode="popLayout">
        <div className="space-y-2">
          {displayed.map((notif, i) => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => { if (!notif.isRead) void markOneRead(notif.id); }}
              className={`
                group relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer
                transition-all duration-200 hover:border-white/12
                ${notif.isRead
                  ? "border-white/5 bg-white/2 opacity-70 hover:opacity-90"
                  : "border-primary/15 bg-primary/4 hover:bg-primary/6"
                }
              `}
            >
              {/* Unread dot */}
              {!notif.isRead && (
                <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary shadow-[0_0_6px_hsl(188_86%_53%/0.8)]" />
              )}

              <NotifIcon type={notif.type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-0.5">
                  <p className={`text-sm font-semibold leading-snug ${notif.isRead ? "text-white/60" : "text-white"}`}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] text-white/25 font-mono shrink-0 mt-0.5">
                    {timeAgo(notif.createdAt)}
                  </span>
                </div>

                {notif.body && (
                  <p className="text-xs text-white/40 leading-relaxed line-clamp-2 mb-2">
                    {notif.body}
                  </p>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`
                    inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded
                    ${notif.type === "new_comment"
                      ? "bg-primary/8 text-primary/60"
                      : notif.type === "high_activity"
                        ? "bg-yellow-500/8 text-yellow-400/60"
                        : "bg-white/6 text-white/30"
                    }
                  `}>
                    {notif.type === "new_comment" && <MessageSquare className="w-2.5 h-2.5" />}
                    {notif.type === "high_activity" && <Zap className="w-2.5 h-2.5" />}
                    {notif.type.replace(/_/g, " ")}
                  </span>

                  {notif.projectId && (
                    <Link
                      href={`/admin/comments`}
                      onClick={e => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] text-primary/50 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View comments
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {/* Stats footer */}
      {!loading && notifications.length > 0 && (
        <div className="flex items-center gap-4 pt-4 border-t border-white/5 text-xs text-white/25">
          <span>{notifications.length} total</span>
          <span>•</span>
          <span>{notifications.filter(n => n.isRead).length} read</span>
          <span>•</span>
          <span>{unreadCount} unread</span>
        </div>
      )}
    </div>
  );
}
