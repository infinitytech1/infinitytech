import { Router } from "express";

const router = Router();

// Supabase has been disabled. Schema is managed by Drizzle ORM via `pnpm --filter @workspace/db run push`.
router.post("/setup/schema", (_req, res) => {
  res.json({ ok: true, message: "Schema is managed by Drizzle ORM. Run `pnpm --filter @workspace/db run push` to apply migrations." });
});

export default router;
