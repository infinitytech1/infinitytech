import { Router } from "express";
import { db, analyticsEvents, projectStats, pool } from "@workspace/db";
import { eq, sql, desc, and, gte } from "drizzle-orm";

/* ─── helpers ─────────────────────────────────────────────── */

async function upsertStat(
  projectId: string,
  eventType: "project_view" | "download",
  durationMs?: number,
) {
  await db.insert(analyticsEvents).values({ eventType, projectId, lang: "en" });

  await db.insert(projectStats)
    .values({
      projectId,
      viewsCount:     eventType === "project_view" ? 1 : 0,
      downloadsCount: eventType === "download"      ? 1 : 0,
      avgTimeMs:      durationMs || 0,
    })
    .onConflictDoUpdate({
      target: projectStats.projectId,
      set: {
        viewsCount: eventType === "project_view"
          ? sql`${projectStats.viewsCount} + 1`
          : projectStats.viewsCount,
        downloadsCount: eventType === "download"
          ? sql`${projectStats.downloadsCount} + 1`
          : projectStats.downloadsCount,
        avgTimeMs: durationMs
          ? sql`(${projectStats.avgTimeMs} + ${durationMs}) / 2`
          : projectStats.avgTimeMs,
        updatedAt: sql`NOW()`,
      },
    });
}

const router = Router();

/* POST /api/analytics/event — full event payload */
router.post("/analytics/event", async (req, res) => {
  try {
    const { eventType, projectId, path, lang, referrer, sessionId, durationMs } = req.body as {
      eventType: string; projectId?: string; path?: string; lang?: string;
      referrer?: string; sessionId?: string; durationMs?: number;
    };

    if (!eventType) return res.status(400).json({ error: "eventType is required" });

    await db.insert(analyticsEvents).values({
      eventType, projectId, path, lang: lang || "en", referrer, sessionId, durationMs,
    });

    if (projectId && (eventType === "project_view" || eventType === "download")) {
      await upsertStat(projectId, eventType, durationMs);
    }

    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

/* POST /api/track/view — shorthand: increment view count for a project */
router.post("/track/view", async (req, res) => {
  try {
    const { projectId } = req.body as { projectId?: string };
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    await upsertStat(projectId, "project_view");

    const [stats] = await db.select().from(projectStats).where(eq(projectStats.projectId, projectId));
    return res.json({ ok: true, views: stats?.viewsCount ?? 1 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

/* POST /api/track/download — shorthand: increment download count for a project */
router.post("/track/download", async (req, res) => {
  try {
    const { projectId } = req.body as { projectId?: string };
    if (!projectId) return res.status(400).json({ error: "projectId is required" });

    await upsertStat(projectId, "download");

    const [stats] = await db.select().from(projectStats).where(eq(projectStats.projectId, projectId));
    return res.json({ ok: true, downloads: stats?.downloadsCount ?? 1 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.get("/analytics/summary", async (_req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalPageViews, totalProjectViews, totalDownloads] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)` })
        .from(analyticsEvents)
        .where(and(eq(analyticsEvents.eventType, "page_view"), gte(analyticsEvents.createdAt, thirtyDaysAgo))),
      db.select({ count: sql<number>`COUNT(*)` })
        .from(analyticsEvents)
        .where(and(eq(analyticsEvents.eventType, "project_view"), gte(analyticsEvents.createdAt, thirtyDaysAgo))),
      db.select({ count: sql<number>`COUNT(*)` })
        .from(analyticsEvents)
        .where(eq(analyticsEvents.eventType, "download")),
    ]);

    const uniqueSessions = await db.select({ count: sql<number>`COUNT(DISTINCT session_id)` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, thirtyDaysAgo));

    const daily = await db.execute(sql`
      SELECT
        date_trunc('day', created_at AT TIME ZONE 'UTC')::date::text AS date,
        COUNT(*) FILTER (WHERE event_type = 'page_view')    AS page_views,
        COUNT(*) FILTER (WHERE event_type = 'project_view') AS project_views,
        COUNT(DISTINCT session_id) AS sessions
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1
    `);

    const topPages = await db.execute(sql`
      SELECT path, COUNT(*) AS views
      FROM analytics_events
      WHERE event_type = 'page_view' AND path IS NOT NULL
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY path ORDER BY views DESC LIMIT 10
    `);

    const langSplit = await db.execute(sql`
      SELECT lang, COUNT(*) AS cnt
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY lang
    `);

    const topProjects = await db.select()
      .from(projectStats)
      .orderBy(desc(projectStats.viewsCount))
      .limit(10);

    return res.json({
      totalPageViews: Number(totalPageViews[0]?.count ?? 0),
      totalProjectViews: Number(totalProjectViews[0]?.count ?? 0),
      totalDownloads: Number(totalDownloads[0]?.count ?? 0),
      uniqueSessions: Number(uniqueSessions[0]?.count ?? 0),
      daily: daily.rows,
      topPages: topPages.rows,
      langSplit: langSplit.rows,
      topProjects,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

// ── GET /api/analytics — real-time project aggregates for the Dashboard ──────
// Returns four aggregate shapes from the projects table, all in a single
// round-trip to Neon by running parallel queries via the connection pool.
router.get("/analytics", async (_req, res) => {
  try {
    const client = await pool.connect();
    try {
      const [totals, byType, recent, perMonth] = await Promise.all([
        // 1. Totals + media breakdown
        client.query(`
          SELECT
            COUNT(*)::int                                                    AS total_projects,
            COUNT(*) FILTER (WHERE model_3d_url IS NOT NULL)::int           AS has_3d,
            COUNT(*) FILTER (WHERE video_url    IS NOT NULL)::int           AS has_video,
            COUNT(*) FILTER (WHERE thumbnail_url IS NOT NULL)::int          AS has_thumbnail,
            COUNT(*) FILTER (WHERE model_3d_url IS NULL
                                AND video_url   IS NULL)::int               AS no_engineering
          FROM projects
        `),

        // 2. Projects grouped by category — NULL / empty → "Uncategorized"
        client.query(`
          SELECT
            COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS name,
            COUNT(*)::int                                          AS value
          FROM projects
          GROUP BY 1
          ORDER BY value DESC
        `),

        // 3. Five most recently created projects
        client.query(`
          SELECT id,
                 COALESCE(NULLIF(title_en, ''), title_ar) AS title,
                 status,
                 COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category,
                 created_at
          FROM projects
          ORDER BY created_at DESC
          LIMIT 5
        `),

        // 4. Projects created per calendar month (for bar chart, all time)
        client.query(`
          SELECT
            TO_CHAR(DATE_TRUNC('month', created_at AT TIME ZONE 'UTC'), 'Mon ''YY') AS month,
            DATE_TRUNC('month', created_at AT TIME ZONE 'UTC')                       AS month_ts,
            COUNT(*)::int                                                             AS count
          FROM projects
          GROUP BY month_ts
          ORDER BY month_ts
        `),
      ]);

      const t = totals.rows[0];

      console.log("[GET /analytics] ✓ Aggregates computed:", {
        totalProjects: t.total_projects,
        has3d: t.has_3d,
        hasVideo: t.has_video,
        categories: byType.rows.length,
        months: perMonth.rows.length,
      });

      return res.json({
        totalProjects:    t.total_projects,
        mediaStats: {
          has3d:           t.has_3d,
          hasVideo:        t.has_video,
          hasThumbnail:    t.has_thumbnail,
          noEngineering:   t.no_engineering,
        },
        projectsByType:   byType.rows,          // [{ name, value }]
        recentActivity:   recent.rows,           // [{ id, title, status, category, created_at }]
        projectsPerMonth: perMonth.rows.map(r => ({
          month: r.month,
          count: r.count,
        })),
      });

    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[GET /analytics] ✗ Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

router.get("/analytics/project/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await db.select().from(projectStats).where(eq(projectStats.projectId, id));

    const recentEvents = await db.select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.projectId, id))
      .orderBy(desc(analyticsEvents.createdAt))
      .limit(50);

    return res.json({ stats: stats[0] || null, recentEvents });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
