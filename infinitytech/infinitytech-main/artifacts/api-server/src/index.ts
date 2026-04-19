import app from "./app";
import { initDatabase } from "@workspace/db";
import { logger } from "./lib/logger";

// IMPORTANT: initialize once
let isInitialized = false;

async function handler(req: any, res: any) {
  try {
    if (!isInitialized) {
      await initDatabase();
      isInitialized = true;
      logger.info("Database initialized");
    }

    return app(req, res);
  } catch (err) {
    logger.error({ err }, "Server error");
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}

export default handler;
