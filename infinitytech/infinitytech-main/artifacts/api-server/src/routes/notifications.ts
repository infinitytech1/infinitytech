import { Router } from "express";
import { db, notifications } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

const ADMIN_PIN_HEADER = "x-admin-pin";

function isAdmin(req: any): boolean {
  return req.headers[ADMIN_PIN_HEADER] === (process.env.ADMIN_PIN || "admin2024");
}

router.get("/notifications", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    const rows = await db.select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    const unreadCount = await db.select({ count: sql<number>`COUNT(*)` })
      .from(notifications)
      .where(eq(notifications.isRead, false));

    return res.json({ notifications: rows, unreadCount: Number(unreadCount[0]?.count ?? 0) });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.patch("/notifications/read-all", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    await db.update(notifications).set({ isRead: true }).where(eq(notifications.isRead, false));
    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.patch("/notifications/:id/read", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, Number(req.params.id)));

    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
