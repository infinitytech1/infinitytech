import { Router } from "express";
import { db, contactMessages } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { broadcastPush } from "./push";

const router = Router();

const contactSchema = z.object({
  name:    z.string().min(2).max(100),
  phone:   z.string().min(7).max(30),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(5000),
});

router.post("/contact", async (req, res) => {
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input", details: parsed.error.issues });
  }

  try {
    await db.insert(contactMessages).values(parsed.data);

    // Count total messages for the privacy-safe push body
    let total = 1;
    try {
      const [row] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contactMessages);
      total = row?.count ?? 1;
    } catch {}

    // Fire-and-forget — NO sender name or message content in the payload
    broadcastPush({
      title: "📩 New Message Received",
      body:  total === 1
        ? "You have 1 unread message"
        : `You have ${total} unread messages`,
      icon:  "/favicon.svg",
      tag:   "new-contact",
      url:   "/admin-infinity",
    } as any).catch(() => {});

    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/messages?pin=<pin>
router.get("/admin/messages", async (req, res) => {
  const validPin = process.env.ADMIN_PIN || "admin2024";
  if (req.query.pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const msgs = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.created_at));
    return res.json({ messages: msgs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/messages/:id?pin=<pin>
router.delete("/admin/messages/:id", async (req, res) => {
  const validPin = process.env.ADMIN_PIN || "admin2024";
  if (req.query.pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    await db.delete(contactMessages).where(eq(contactMessages.id, id));
    return res.json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
