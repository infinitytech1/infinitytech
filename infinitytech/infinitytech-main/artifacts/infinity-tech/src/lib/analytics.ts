const PAGE_VIEWS_KEY = "it-analytics-pageviews";
const PROJECT_VIEWS_KEY = "it-analytics-projectviews";
const SESSIONS_KEY = "it-analytics-sessions";

export interface PageViewEntry {
  path: string;
  timestamp: number;
  lang: string;
  referrer: string;
  sessionId: string;
}

export interface ProjectViewEntry {
  projectId: string;
  projectSlug: string;
  timestamp: number;
  sessionId: string;
  downloaded: boolean;
}

export interface AnalyticsSummary {
  totalPageViews: number;
  uniqueSessions: number;
  pageBreakdown: Record<string, number>;
  projectViews: Record<string, number>;
  projectDownloads: Record<string, number>;
  recentPageViews: PageViewEntry[];
  dailyViews: { date: string; views: number; sessions: number }[];
  topProjects: { id: string; slug: string; views: number; downloads: number }[];
  langBreakdown: { en: number; ar: number };
}

function getSessionId(): string {
  let sid = sessionStorage.getItem("it-session-id");
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem("it-session-id", sid);
    const sessions = loadSessions();
    sessions.push({ id: sid, start: Date.now() });
    saveSessions(sessions);
  }
  return sid;
}

function loadPageViews(): PageViewEntry[] {
  try {
    return JSON.parse(localStorage.getItem(PAGE_VIEWS_KEY) || "[]");
  } catch { return []; }
}

function savePageViews(views: PageViewEntry[]) {
  const trimmed = views.slice(-2000);
  localStorage.setItem(PAGE_VIEWS_KEY, JSON.stringify(trimmed));
}

function loadProjectViews(): ProjectViewEntry[] {
  try {
    return JSON.parse(localStorage.getItem(PROJECT_VIEWS_KEY) || "[]");
  } catch { return []; }
}

function saveProjectViews(views: ProjectViewEntry[]) {
  const trimmed = views.slice(-2000);
  localStorage.setItem(PROJECT_VIEWS_KEY, JSON.stringify(trimmed));
}

function loadSessions(): { id: string; start: number }[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
  } catch { return []; }
}

function saveSessions(sessions: { id: string; start: number }[]) {
  const trimmed = sessions.slice(-500);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
}

function sendEventToDb(payload: {
  eventType: string;
  projectId?: string;
  path?: string;
  lang?: string;
  referrer?: string;
  sessionId?: string;
}) {
  fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => { /* silent — DB is optional, local storage is primary */ });
}

export function trackPageView(path: string, lang: "en" | "ar" = "en") {
  try {
    const sid = getSessionId();
    const views = loadPageViews();
    views.push({
      path,
      timestamp: Date.now(),
      lang,
      referrer: document.referrer || "direct",
      sessionId: sid,
    });
    savePageViews(views);
    sendEventToDb({ eventType: "page_view", path, lang, referrer: document.referrer || "direct", sessionId: sid });
  } catch {}
}

export function trackProjectView(projectId: string, projectSlug: string) {
  try {
    const sid = getSessionId();
    const views = loadProjectViews();
    const last = views.findLast?.(v => v.projectId === projectId && v.sessionId === sid)
      ?? [...views].reverse().find(v => v.projectId === projectId && v.sessionId === sid);
    if (last && Date.now() - last.timestamp < 30_000) return;
    views.push({
      projectId,
      projectSlug,
      timestamp: Date.now(),
      sessionId: sid,
      downloaded: false,
    });
    saveProjectViews(views);
    sendEventToDb({ eventType: "project_view", projectId, path: `/projects/${projectSlug}`, sessionId: sid });
  } catch {}
}

export function trackProjectDownload(projectId: string) {
  try {
    const sid = getSessionId();
    const views = loadProjectViews();
    const entry = [...views].reverse().find(v => v.projectId === projectId && v.sessionId === sid);
    if (entry) {
      entry.downloaded = true;
      saveProjectViews(views);
    } else {
      views.push({ projectId, projectSlug: projectId, timestamp: Date.now(), sessionId: sid, downloaded: true });
      saveProjectViews(views);
    }
    sendEventToDb({ eventType: "download", projectId, sessionId: sid });
  } catch {}
}

function isoDate(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function getAnalyticsSummary(): AnalyticsSummary {
  const pageViews = loadPageViews();
  const projectViews = loadProjectViews();

  const pageBreakdown: Record<string, number> = {};
  const langBreakdown = { en: 0, ar: 0 };
  const dailyMap: Record<string, { views: number; sessions: Set<string> }> = {};
  const allSessions = new Set<string>();

  for (const v of pageViews) {
    pageBreakdown[v.path] = (pageBreakdown[v.path] || 0) + 1;
    if (v.lang === "ar") langBreakdown.ar++; else langBreakdown.en++;
    allSessions.add(v.sessionId);
    const d = isoDate(v.timestamp);
    if (!dailyMap[d]) dailyMap[d] = { views: 0, sessions: new Set() };
    dailyMap[d].views++;
    dailyMap[d].sessions.add(v.sessionId);
  }

  const dailyViews = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, { views, sessions }]) => ({ date, views, sessions: sessions.size }));

  const projectViewMap: Record<string, number> = {};
  const projectDownloadMap: Record<string, number> = {};
  const projectSlugMap: Record<string, string> = {};

  for (const v of projectViews) {
    projectViewMap[v.projectId] = (projectViewMap[v.projectId] || 0) + 1;
    projectSlugMap[v.projectId] = v.projectSlug;
    if (v.downloaded) {
      projectDownloadMap[v.projectId] = (projectDownloadMap[v.projectId] || 0) + 1;
    }
  }

  const topProjects = Object.entries(projectViewMap)
    .map(([id, views]) => ({
      id,
      slug: projectSlugMap[id] || id,
      views,
      downloads: projectDownloadMap[id] || 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return {
    totalPageViews: pageViews.length,
    uniqueSessions: allSessions.size,
    pageBreakdown,
    projectViews: projectViewMap,
    projectDownloads: projectDownloadMap,
    recentPageViews: pageViews.slice(-50).reverse(),
    dailyViews,
    topProjects,
    langBreakdown,
  };
}

export function clearAnalytics() {
  localStorage.removeItem(PAGE_VIEWS_KEY);
  localStorage.removeItem(PROJECT_VIEWS_KEY);
  localStorage.removeItem(SESSIONS_KEY);
}
