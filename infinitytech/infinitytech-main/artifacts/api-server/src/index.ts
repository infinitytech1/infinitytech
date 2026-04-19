import app from "./app";
import { logger } from "./lib/logger";
import { initDatabase } from "@workspace/db";

// ── Environment variable validation ──────────────────────────────────────────
const REQUIRED_ENV: string[] = [
  "DATABASE_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key] || process.env[key] === key) {
    console.error(`[Startup] ⚠  Environment variable ${key} is missing or is a placeholder`);
  }
}

// ── Port ─────────────────────────────────────────────────────────────────────
const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ── Database init then start server ──────────────────────────────────────────
initDatabase()
  .then(() => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
    });
  })
  .catch((err) => {
    logger.error({ err }, "Database initialisation failed — aborting startup");
    process.exit(1);
  });
