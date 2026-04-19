import { Router } from "express";
import { db } from "@workspace/db";
import { skills } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const pin = req.headers["x-admin-pin"];
  const validPin = process.env.ADMIN_PIN || "admin2024";
  if (pin !== validPin) return res.status(401).json({ error: "Unauthorized" });
  next();
}

// GET /api/skills — public; list all skills ordered by sort_order then name
router.get("/skills", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(skills)
      .orderBy(asc(skills.sort_order), asc(skills.name_en));
    res.json({ skills: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/skills — admin only
router.post("/skills", requireAdmin, async (req, res) => {
  try {
    const { name_en, name_ar, category, level, sort_order } = req.body as {
      name_en?: string;
      name_ar?: string;
      category?: string;
      level?: string;
      sort_order?: number;
    };

    if (!name_en?.trim()) {
      return res.status(400).json({ error: "name_en is required" });
    }

    const [row] = await db.insert(skills).values({
      name_en: name_en.trim(),
      name_ar: (name_ar ?? "").trim(),
      category: (category ?? "General").trim(),
      level: level?.trim() || null,
      sort_order: sort_order ?? 0,
    }).returning();

    res.status(201).json({ skill: row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/skills/:id — admin only
router.patch("/skills/:id", requireAdmin, async (req, res) => {
  try {
    const allowed = ["name_en", "name_ar", "category", "level", "sort_order"] as const;
    const updates: Record<string, unknown> = { updated_at: new Date() };

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const [row] = await db
      .update(skills)
      .set(updates)
      .where(eq(skills.id, req.params.id))
      .returning();

    if (!row) return res.status(404).json({ error: "Skill not found" });
    res.json({ skill: row });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/skills/:id — admin only
router.delete("/skills/:id", requireAdmin, async (req, res) => {
  try {
    const [row] = await db
      .delete(skills)
      .where(eq(skills.id, req.params.id))
      .returning({ id: skills.id });

    if (!row) return res.status(404).json({ error: "Skill not found" });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
