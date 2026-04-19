import { Router } from "express";
import { db, comments, notifications, insertCommentSchema } from "@workspace/db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

const router = Router();

const ADMIN_PIN_HEADER = "x-admin-pin";

function getAdminPin(): string {
  return process.env.ADMIN_PIN || "admin2024";
}

function isAdmin(req: any): boolean {
  return req.headers[ADMIN_PIN_HEADER] === getAdminPin();
}

router.get("/comments/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const admin = isAdmin(req);

    const rows = await db.select()
      .from(comments)
      .where(
        admin
          ? and(eq(comments.projectId, projectId), eq(comments.isDeleted, false))
          : and(eq(comments.projectId, projectId), eq(comments.isDeleted, false), eq(comments.isHidden, false))
      )
      .orderBy(desc(comments.createdAt));

    const roots = rows.filter(c => c.parentId === null || c.parentId === 0);
    const replies = rows.filter(c => c.parentId !== null && c.parentId > 0);

    const tree = roots.map(root => ({
      ...root,
      replies: replies.filter(r => r.parentId === root.id),
    }));

    return res.json(tree);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.get("/comments", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    const rows = await db.select()
      .from(comments)
      .where(eq(comments.isDeleted, false))
      .orderBy(desc(comments.createdAt))
      .limit(200);

    return res.json(rows);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.post("/comments", async (req, res) => {
  try {
    const parsed = insertCommentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });

    const { name, message, projectId, parentId } = parsed.data;

    const [inserted] = await db.insert(comments)
      .values({ name, message, projectId, parentId: parentId ?? null })
      .returning();

    await db.insert(notifications).values({
      type: "new_comment",
      projectId,
      title: `New comment on project "${projectId}"`,
      body: `${name}: ${message.slice(0, 100)}${message.length > 100 ? "…" : ""}`,
    });

    return res.status(201).json(inserted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.patch("/comments/:id/hide", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    const { hidden } = req.body as { hidden?: boolean };

    await db.update(comments)
      .set({ isHidden: hidden !== false })
      .where(eq(comments.id, id));

    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

router.delete("/comments/:id", async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: "Forbidden" });

    const id = Number(req.params.id);
    await db.update(comments)
      .set({ isDeleted: true })
      .where(eq(comments.id, id));

    return res.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
