import { Router, type IRouter } from "express";

const router: IRouter = Router();

const startedAt = new Date().toISOString();

function healthPayload() {
  return {
    status: "ok",
    uptime: Math.floor(process.uptime()),
    startedAt,
    environment: process.env.NODE_ENV ?? "unknown",
    timestamp: new Date().toISOString(),
  };
}

// GET /api/health — standard health check (human-friendly path)
router.get("/health", (_req, res) => {
  const data = healthPayload();
  console.log("[GET /api/health] ✓ hit — uptime:", data.uptime + "s");
  res.json(data);
});

// GET /api/healthz — Kubernetes-style alias kept for backwards compatibility
router.get("/healthz", (_req, res) => {
  res.json(healthPayload());
});

export default router;
