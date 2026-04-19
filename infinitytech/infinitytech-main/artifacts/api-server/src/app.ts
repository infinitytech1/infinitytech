import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Trust Replit's reverse proxy ──────────────────────────────────────────────
app.set("trust proxy", 1);

// ── Security headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

// ── CORS — allow portfolio + admin origins ────────────────────────────────────
const allowedOrigins = [
  /\.replit\.app$/,
  /\.replit\.dev$/,
  /localhost/,
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      const ok = allowedOrigins.some(pat =>
        pat instanceof RegExp ? pat.test(origin) : origin === pat
      );
      cb(ok ? null : new Error("CORS: origin not allowed"), ok);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-pin", "Authorization"],
    credentials: true,
  })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Write rate limit exceeded." },
});

app.use("/api", apiLimiter);
app.use("/api/projects", (req: Request, res: Response, next: NextFunction) => {
  if (["POST", "PATCH", "DELETE"].includes(req.method)) return writeLimiter(req, res, next);
  next();
});

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Static uploads (project thumbnails) ──────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "public", "uploads"), {
    maxAge: "30d",
    immutable: false,
  })
);

// ── API root info (GET /) — prevents confusing 404 noise in proxy logs ────────
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Infinity Tech API",
    version: "1.0.0",
    status: "ok",
    docs: "/api/health",
    endpoints: [
      "GET  /api/health",
      "GET  /api/projects",
      "POST /api/projects",
      "GET  /api/projects/:id",
      "PUT  /api/projects/:id",
      "PATCH /api/projects/:id",
      "DELETE /api/projects/:id",
    ],
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
// Log every successful API hit so failures are easy to distinguish in the console
app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
  console.log(`[ROUTE] ${req.method} /api${req.path}`);
  next();
});

app.use("/api", router);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  console.warn(`[404] ${req.method} ${req.path} — no route matched`);
  res.status(404).json({ error: "Not found", path: req.path });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

export default app;
