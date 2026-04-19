import { useState, useEffect } from "react";
import {
  DAILY_VISITS, PROJECT_STATS, TRAFFIC_SOURCES, HOURLY_DATA,
  COUNTRY_STATS, TOTAL_STATS
} from "@/admin/data/analytics";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { motion } from "framer-motion";
import { Users, Eye, Download, Clock, TrendingUp, Globe, Zap, Activity, Trash2 } from "lucide-react";
import { getAnalyticsSummary, clearAnalytics, type AnalyticsSummary } from "@/lib/analytics";

const chartTheme = { tick: "hsl(218 11% 55%)", grid: "hsl(215 30% 12%)" };

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, color = "text-primary" }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-lg bg-card border border-border">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}

function LiveAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    setSummary(getAnalyticsSummary());
  }, [cleared]);

  const handleClear = () => {
    if (window.confirm("Clear all real analytics data? This cannot be undone.")) {
      clearAnalytics();
      setCleared(c => !c);
    }
  };

  if (!summary) return null;

  const hasData = summary.totalPageViews > 0;
  const dailyChartData = summary.dailyViews.map(d => ({
    date: d.date.slice(5),
    Views: d.views,
    Sessions: d.sessions,
  }));

  const pageData = Object.entries(summary.pageBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([path, count]) => ({ path: path === "/" ? "Home" : path, count }));

  const langData = [
    { name: "English", value: summary.langBreakdown.en, fill: "hsl(188 86% 53%)" },
    { name: "Arabic", value: summary.langBreakdown.ar, fill: "hsl(271 80% 70%)" },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Live Tracking
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real visitor data tracked from this browser session — stored locally
          </p>
        </div>
        {hasData && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>
        )}
      </div>

      {!hasData ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center">
          <Activity className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No tracking data yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Visit the public pages to start collecting data</p>
        </div>
      ) : (
        <>
          {/* Live metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Eye} label="Page Views" value={summary.totalPageViews.toLocaleString()} sub="All time" />
            <MetricCard icon={Users} label="Sessions" value={summary.uniqueSessions.toLocaleString()} sub="Unique" color="text-chart-2" />
            <MetricCard icon={Download} label="Downloads" value={Object.values(summary.projectDownloads).reduce((a, b) => a + b, 0).toLocaleString()} sub="All projects" color="text-chart-4" />
            <MetricCard icon={Globe} label="Projects Viewed" value={Object.keys(summary.projectViews).length.toLocaleString()} sub="Unique projects" color="text-chart-3" />
          </div>

          {/* Daily views chart */}
          {dailyChartData.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Daily Views</h3>
                <p className="text-xs text-muted-foreground">Page views and sessions by day</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="lv1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(188 86% 53%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(188 86% 53%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="lv2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(271 80% 70%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(271 80% 70%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                  <XAxis dataKey="date" tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                  <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tick }} />
                  <Area type="monotone" dataKey="Views" stroke="hsl(188 86% 53%)" fill="url(#lv1)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Sessions" stroke="hsl(271 80% 70%)" fill="url(#lv2)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Page breakdown */}
            {pageData.length > 0 && (
              <div className="bg-card border border-card-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Top Pages</h3>
                <div className="space-y-3">
                  {pageData.map((d, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-foreground">{d.path}</span>
                        <span className="font-semibold text-primary">{d.count}</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full transition-all"
                          style={{ width: `${(d.count / (pageData[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lang breakdown + top projects */}
            <div className="space-y-4">
              {langData.length > 0 && (
                <div className="bg-card border border-card-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Language Split</h3>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={100} height={100}>
                      <PieChart>
                        <Pie data={langData} cx="50%" cy="50%" innerRadius={28} outerRadius={45} dataKey="value" paddingAngle={3}>
                          {langData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => `${v} views`} contentStyle={{ background: "hsl(216 29% 10%)", border: "1px solid hsl(215 30% 15%)", borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {langData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-semibold text-foreground ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {summary.topProjects.length > 0 && (
                <div className="bg-card border border-card-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Top Projects</h3>
                  <div className="space-y-2">
                    {summary.topProjects.slice(0, 5).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-muted-foreground truncate max-w-[140px]">{p.slug}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-foreground">{p.views} views</span>
                          {p.downloads > 0 && <span className="text-chart-4">{p.downloads} ↓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent activity feed */}
          {summary.recentPageViews.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
              </div>
              <div className="divide-y divide-border">
                {summary.recentPageViews.slice(0, 10).map((v, i) => (
                  <div key={i} className="px-5 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      <span className="font-mono text-muted-foreground">{v.path}</span>
                      {v.lang === "ar" && <span className="px-1.5 py-0.5 rounded bg-chart-2/20 text-chart-2 font-mono">AR</span>}
                    </div>
                    <span className="text-muted-foreground/60">
                      {new Date(v.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Analytics() {
  const [tab, setTab] = useState<"live" | "demo">("live");

  const fullData = DAILY_VISITS.map(d => ({
    date: d.date.slice(5),
    Visitors: d.visitors,
    "Page Views": d.pageViews,
    "Unique Visitors": d.uniqueVisitors,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Track real visitors or explore demo data</p>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 w-fit border border-border">
        {[
          { id: "live" as const, label: "Live Data", icon: Activity },
          { id: "demo" as const, label: "Demo Data", icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id
                ? "bg-card border border-border text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === "live" ? (
        <LiveAnalytics />
      ) : (
        <>
          <div>
            <p className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-2 inline-block">
              Demo data · Wire to a real analytics backend to replace this
            </p>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricCard icon={Users} label="Total Visitors" value={TOTAL_STATS.totalVisitors.toLocaleString()} sub="30 days" />
            <MetricCard icon={Eye} label="Page Views" value={TOTAL_STATS.totalPageViews.toLocaleString()} sub="30 days" color="text-chart-2" />
            <MetricCard icon={Download} label="Downloads" value={TOTAL_STATS.totalDownloads.toLocaleString()} sub="All time" color="text-chart-4" />
            <MetricCard icon={Clock} label="Avg Session" value={TOTAL_STATS.avgSessionDuration} sub="minutes" color="text-chart-3" />
            <MetricCard icon={TrendingUp} label="Bounce Rate" value={TOTAL_STATS.bounceRate} sub="Lower is better" color="text-chart-5" />
            <MetricCard icon={Zap} label="New Visitors" value={TOTAL_STATS.newVisitorsRate} sub="of total" color="text-chart-4" />
          </div>

          {/* Full 30-day chart */}
          <div className="bg-card border border-card-border rounded-xl p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-foreground">Visitor Trends — 30 Days</h2>
              <p className="text-xs text-muted-foreground">Daily breakdown with page views and unique visitors</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={fullData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(188 86% 53%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(188 86% 53%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(271 80% 70%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(271 80% 70%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38 92% 60%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(38 92% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="date" tick={{ fill: chartTheme.tick, fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tick }} />
                <Area type="monotone" dataKey="Visitors" stroke="hsl(188 86% 53%)" fill="url(#g1)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Page Views" stroke="hsl(271 80% 70%)" fill="url(#g2)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Unique Visitors" stroke="hsl(38 92% 60%)" fill="url(#g3)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Row: project stats + hourly */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">Top Projects by Views</h2>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={PROJECT_STATS.map(p => ({ name: p.title.split(" ").slice(0, 2).join(" "), Views: p.views, Downloads: p.downloads }))} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: chartTheme.tick, fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: chartTheme.tick, fontSize: 10 }} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tick }} />
                  <Bar dataKey="Views" fill="hsl(188 86% 53%)" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Downloads" fill="hsl(271 80% 70%)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">Peak Hours</h2>
                <p className="text-xs text-muted-foreground">Hourly visitor distribution (UTC)</p>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={HOURLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: chartTheme.tick, fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: chartTheme.tick, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="visitors" fill="hsl(188 86% 53%)" radius={[2, 2, 0, 0]} name="Visitors" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Row: traffic sources + countries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-foreground">Traffic Sources</h2>
              </div>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={TRAFFIC_SOURCES} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {TRAFFIC_SOURCES.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: "hsl(216 29% 10%)", border: "1px solid hsl(215 30% 15%)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {TRAFFIC_SOURCES.map((s, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.fill }} />
                          <span className="text-muted-foreground">{s.name}</span>
                        </div>
                        <span className="font-semibold text-foreground">{s.value}%</span>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.value}%`, background: s.fill }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Top Countries</h2>
              </div>
              <div className="space-y-3">
                {COUNTRY_STATS.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.flag}</span>
                        <span className="text-foreground">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{c.visitors.toLocaleString()}</span>
                        <span className="font-semibold text-foreground w-12 text-right">{c.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-full" style={{ width: `${c.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Per-project table */}
          <div className="bg-card border border-card-border rounded-xl">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Project Performance Details</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Project</th>
                  <th className="text-right px-5 py-3">Views</th>
                  <th className="text-right px-5 py-3">Downloads</th>
                  <th className="text-right px-5 py-3">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PROJECT_STATS.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{p.title}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{p.views.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{p.downloads.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-mono text-muted-foreground">{p.avgTimeOnPage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
