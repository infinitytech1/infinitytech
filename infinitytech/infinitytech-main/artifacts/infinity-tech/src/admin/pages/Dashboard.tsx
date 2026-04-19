import { useState, useEffect } from "react";
import { useStore } from "@/admin/data/store";
import { DAILY_VISITS } from "@/admin/data/analytics";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";
import {
  FolderOpen, Download, TrendingUp, GitCommit,
  ExternalLink, Clock, Activity, Box, Film, Layers,
} from "lucide-react";
import { Link } from "wouter";

// ── Color palette — consistent across both charts ─────────────────────────────
const PALETTE = [
  "hsl(188 86% 53%)",
  "hsl(271 80% 70%)",
  "hsl(38 92% 60%)",
  "hsl(142 70% 50%)",
  "hsl(0 72% 65%)",
  "hsl(215 80% 65%)",
  "hsl(330 70% 65%)",
];

const chartTheme = {
  tick:   "hsl(218 11% 55%)",
  grid:   "hsl(215 30% 12%)",
};

const STATUS_COLOR: Record<string, string> = {
  completed: "text-chart-4 bg-chart-4/10",
  active:    "text-primary bg-primary/10",
  archived:  "text-muted-foreground bg-muted",
  draft:     "text-yellow-400 bg-yellow-400/10",
};

const COMMIT_COLOR: Record<string, string> = {
  create: "bg-chart-4",
  update: "bg-primary",
  release: "bg-chart-2",
  fix: "bg-chart-3",
  design: "bg-chart-5",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  totalProjects:    number;
  mediaStats: {
    has3d:          number;
    hasVideo:       number;
    hasThumbnail:   number;
    noEngineering:  number;
  };
  projectsByType:   { name: string; value: number }[];
  recentActivity:   { id: string; title: string; status: string; category: string; created_at: string }[];
  projectsPerMonth: { month: string; count: number }[];
}

// ── Skeleton block ────────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/5 ${className}`} />
  );
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="space-y-3" style={{ height }}>
      <div className="flex items-end gap-2 h-full pb-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1"
            style={{ height: `${30 + ((i * 17 + 40) % 60)}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function DonutSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-36 h-36">
        <div className="absolute inset-0 rounded-full border-[14px] border-white/5 animate-pulse" />
        <div className="absolute inset-4 rounded-full border-[14px] border-white/3 animate-pulse" />
      </div>
      <div className="w-full space-y-2">
        {[80, 60, 50, 40].map((w, i) => <Skeleton key={i} className="h-3" style={{ width: `${w}%` } as React.CSSProperties} />)}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = "text-primary", loading = false }: {
  icon: any; label: string; value: string | number; sub?: string;
  color?: string; loading?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-card-border rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          {loading
            ? <Skeleton className="h-8 w-16 mb-1" />
            : <p className="text-3xl font-bold text-foreground">{value}</p>
          }
          {sub && !loading && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          {loading && <Skeleton className="h-3 w-24 mt-1" />}
        </div>
        <div className="p-2.5 rounded-lg bg-card border border-border shrink-0">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-medium">
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}

// ── Custom donut label ─────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, totalProjects }: { cx: number; cy: number; totalProjects: number }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="hsl(213 31% 91%)">
      <tspan x={cx} dy="-0.4em" fontSize="22" fontWeight="700">{totalProjects}</tspan>
      <tspan x={cx} dy="1.4em" fontSize="11" fill="hsl(218 11% 55%)">projects</tspan>
    </text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { projects } = useStore();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAnalyticsLoading(true);
    setAnalyticsError(null);

    fetch("/api/analytics")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<AnalyticsData>;
      })
      .then(data => {
        if (!cancelled) {
          setAnalytics(data);
          setAnalyticsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("[Dashboard] Analytics fetch failed:", err);
          setAnalyticsError(err.message);
          setAnalyticsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // Derived values from store (always available)
  const activeCount     = projects.filter(p => p.status === "active").length;
  const totalViews      = projects.reduce((s, p) => s + (p.views ?? 0), 0);
  const totalDownloads  = projects.reduce((s, p) => s + (p.downloads ?? 0), 0);

  const recentCommits = projects
    .flatMap(p => (p.commits ?? []).map(c => ({ ...c, projectTitle: p.title, projectId: p.id })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  const visitorData = DAILY_VISITS.slice(-14).map(d => ({
    date:        d.date.slice(5),
    Visitors:    d.visitors,
    "Page Views": d.pageViews,
  }));

  const now     = new Date();
  const hour    = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Donut colour assignment — stable by index so colours don't shuffle on refetch
  const donutData = (analytics?.projectsByType ?? []).map((row, i) => ({
    ...row,
    fill: PALETTE[i % PALETTE.length],
  }));

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, Fares <span className="text-primary">👋</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}  label="Total Projects"
          value={analyticsLoading ? "—" : (analytics?.totalProjects ?? projects.length)}
          sub={`${activeCount} active`}
          loading={analyticsLoading}
        />
        <StatCard
          icon={Box}  label="With 3D Models"
          value={analyticsLoading ? "—" : (analytics?.mediaStats.has3d ?? 0)}
          sub="GLB / STEP files"
          color="text-chart-2"
          loading={analyticsLoading}
        />
        <StatCard
          icon={Download}  label="Total Downloads"
          value={totalDownloads.toLocaleString()}
          sub="All time"
          color="text-chart-4"
        />
        <StatCard
          icon={TrendingUp}  label="Total Views"
          value={totalViews.toLocaleString()}
          sub="All projects"
          color="text-chart-3"
        />
      </div>

      {/* ── Charts row — visitor trend + donut ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Visitor trend — mock data preserved (real analytics_events integrated separately) */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Visitor Trend</h2>
              <p className="text-xs text-muted-foreground">Last 14 days</p>
            </div>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={visitorData}>
              <defs>
                <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(188 86% 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(188 86% 53%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(271 80% 70%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(271 80% 70%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
              <XAxis dataKey="date"     tick={{ fill: chartTheme.tick, fontSize: 11 }} />
              <YAxis                    tick={{ fill: chartTheme.tick, fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Visitors"   stroke="hsl(188 86% 53%)" fill="url(#visitorsGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="Page Views" stroke="hsl(271 80% 70%)" fill="url(#pvGrad)"       strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Project Distribution by Type — REAL data from /api/analytics */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Projects by Type</h2>
              <p className="text-xs text-muted-foreground">Distribution by category</p>
            </div>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>

          {analyticsLoading ? (
            <DonutSkeleton />
          ) : analyticsError ? (
            <p className="text-xs text-red-400 text-center py-8">{analyticsError}</p>
          ) : donutData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No projects yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={68}
                    dataKey="value"
                    paddingAngle={3}
                    labelLine={false}
                  >
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {donutData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.fill }} />
                      <span className="text-muted-foreground truncate">{s.name}</span>
                    </div>
                    <span className="font-medium text-foreground ml-2 shrink-0">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Projects per Month + Recent commits ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Projects Added per Month — REAL data from /api/analytics */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Projects Added per Month</h2>
              <p className="text-xs text-muted-foreground">All time — from Neon DB</p>
            </div>
            <Film className="w-4 h-4 text-muted-foreground" />
          </div>

          {analyticsLoading ? (
            <ChartSkeleton height={220} />
          ) : analyticsError ? (
            <p className="text-xs text-red-400 text-center py-10">{analyticsError}</p>
          ) : !analytics?.projectsPerMonth?.length ? (
            <p className="text-xs text-muted-foreground text-center py-10">No project data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.projectsPerMonth} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: chartTheme.tick, fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: chartTheme.tick, fontSize: 11 }}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Projects"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {analytics.projectsPerMonth.map((_entry, i) => (
                    <Cell
                      key={i}
                      fill={`hsl(188 86% ${38 + (i % 3) * 8}%)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent commits — always real from useStore */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
              <p className="text-xs text-muted-foreground">Commit log</p>
            </div>
            <GitCommit className="w-4 h-4 text-muted-foreground" />
          </div>
          {recentCommits.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No commits yet</p>
          ) : (
            <div className="space-y-3 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {recentCommits.map((c, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-0.5 ${COMMIT_COLOR[c.type] || "bg-primary"}`} />
                  <div className="flex-1 min-w-0">
                    <Link href={`/admin/projects/${c.projectId}`}>
                      <p className="text-xs font-medium text-foreground hover:text-primary truncate cursor-pointer">{c.message}</p>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-muted-foreground">{c.hash}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground truncate">{c.projectTitle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent uploads from Neon — real /api/analytics data ──────────── */}
      <div className="bg-card border border-card-border rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent Uploads</h2>
            <p className="text-xs text-muted-foreground">Last 5 projects added — live from Neon DB</p>
          </div>
          <Link href="/admin/projects">
            <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
              All projects <ExternalLink className="w-3 h-3" />
            </span>
          </Link>
        </div>

        {analyticsLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : analyticsError ? (
          <p className="text-xs text-red-400 px-5 py-4">{analyticsError}</p>
        ) : (analytics?.recentActivity ?? []).length === 0 ? (
          <p className="text-xs text-muted-foreground px-5 py-4">No projects yet</p>
        ) : (
          <div className="divide-y divide-border">
            {(analytics!.recentActivity).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {p.category && (
                        <>
                          <span className="text-muted-foreground/40">·</span>
                          <span className="text-xs text-muted-foreground/70">{p.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] ?? "text-muted-foreground bg-muted"}`}>
                    {p.status}
                  </span>
                  <Link href={`/admin/projects/${p.id}`}>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary cursor-pointer transition-all" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Media stats strip — REAL from /api/analytics ─────────────────── */}
      {!analyticsLoading && analytics && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {[
            { label: "With 3D Model",   value: analytics.mediaStats.has3d,         icon: Box,        color: "text-chart-2" },
            { label: "With Video",      value: analytics.mediaStats.hasVideo,       icon: Film,       color: "text-chart-3" },
            { label: "No Eng. Files",   value: analytics.mediaStats.noEngineering,  icon: Layers,     color: "text-muted-foreground" },
            { label: "Total Projects",  value: analytics.totalProjects,             icon: FolderOpen, color: "text-primary" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-card-border rounded-xl px-4 py-3 flex items-center gap-3">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
