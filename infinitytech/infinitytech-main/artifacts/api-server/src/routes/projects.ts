import { Router } from "express";
import multer from "multer";
import { Readable } from "stream";
import { db, projects, projectStats, pool } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { cloudinary, getUploadSignature } from "../lib/cloudinary";
import { autoTranslateFields } from "../lib/translate";

// ── Server-side Cloudinary upload from an in-memory buffer ────────────────────
// Used exclusively by the engineering-files endpoint so raw files (.glb, .step,
// .pdf, .xlsx) never touch the local filesystem and go straight to Cloudinary.
async function uploadBufferToCloudinary(
  buffer: Buffer,
  options: { resource_type: "raw" | "image" | "video"; folder: string },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: options.resource_type, folder: options.folder },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary] ✗ upload_stream error:", error);
          return reject(error);
        }
        resolve(result!.secure_url);
      },
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

// Multer — memory storage, 50 MB each, no MIME filter (client already restricts types)
const engineeringUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: "model_3d", maxCount: 1 },
  { name: "bom_file", maxCount: 1 },
]);

// Multer for unified project creation — accepts all 4 media fields + metadata
const createUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
}).fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "video",     maxCount: 1 },
  { name: "model_3d",  maxCount: 1 },
  { name: "bom_file",  maxCount: 1 },
]);

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const pin = req.headers["x-admin-pin"];
  const validPin = process.env.ADMIN_PIN || "admin2024";
  if (!pin || pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

/**
 * Verify the projects table exists and is writable before attempting an INSERT.
 * Uses a raw SQL query against information_schema so the check is independent
 * of Drizzle's connection state.
 */
async function checkTable(): Promise<void> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ column_name: string }>(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'projects'
      ORDER BY ordinal_position
    `);

    if (result.rowCount === 0) {
      throw new Error("projects table does not exist — run initDatabase() first");
    }

    const cols = result.rows.map(r => r.column_name);
    console.log(`[checkTable] ✓ projects table ready — ${result.rowCount} columns: ${cols.join(", ")}`);
  } catch (err) {
    console.error("[checkTable] ✗ Table check failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

const ALLOWED_WRITE_FIELDS = new Set([
  "title_en", "title_ar", "description_en", "description_ar",
  "overview_en", "overview_ar", "thumbnail_url", "video_url",
  "assets_zip_url", "model_3d_url", "bom_url",
  "tags", "status", "github_url", "language",
  "timeline", "files", "media", "updates",
  "category", "live_link", "custom_sections",
]);

function sanitizeBody(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_WRITE_FIELDS) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

// GET /api/projects — public
router.get("/projects", async (_req, res) => {
  try {
    const rows = await db.select().from(projects).orderBy(desc(projects.created_at));
    res.json({ projects: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id — public; includes live view/download counts
router.get("/projects/:id", async (req, res) => {
  try {
    const [[row], [stats]] = await Promise.all([
      db.select().from(projects).where(eq(projects.id, req.params.id)),
      db.select().from(projectStats).where(eq(projectStats.projectId, req.params.id)),
    ]);
    if (!row) return res.status(404).json({ error: "Project not found" });

    res.json({
      project: {
        ...row,
        analytics: {
          views:     stats?.viewsCount     ?? 0,
          downloads: stats?.downloadsCount ?? 0,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects — admin only
// Accepts multipart/form-data with:
//   - "meta"      — JSON string of all project metadata fields (snake_case, from adminToDb())
//   - "thumbnail" — image file (optional, resource_type: image)
//   - "video"     — video file (optional, resource_type: video)
//   - "model_3d"  — 3D model file (optional, resource_type: raw)
//   - "bom_file"  — BOM document (optional, resource_type: raw)
// Flow: A) Cloudinary uploads → B) URL collection → C) Single Neon INSERT
router.post("/projects", requireAdmin, (req: any, res: any) => {
  createUpload(req, res, async (multerErr: any) => {
    if (multerErr) {
      console.error("[POST /projects] ✗ Multer error:", multerErr.message);
      return res.status(400).json({ error: `File error: ${multerErr.message}` });
    }

    console.log("--- ATTEMPTING SAVE (unified FormData flow) ---");

    // ── Parse metadata JSON field sent by the frontend ─────────────────────────
    let meta: Record<string, unknown> = {};
    try {
      meta = JSON.parse((req.body as any).meta || "{}");
    } catch (parseErr) {
      console.warn("[POST /projects] ⚠ Could not parse meta JSON — falling back to raw body fields");
      meta = req.body as Record<string, unknown>;
    }

    const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;
    console.log("[POST /projects] ▶ Files received:", {
      thumbnail: files["thumbnail"]?.[0]?.originalname ?? "(none)",
      video:     files["video"]?.[0]?.originalname     ?? "(none)",
      model_3d:  files["model_3d"]?.[0]?.originalname  ?? "(none)",
      bom_file:  files["bom_file"]?.[0]?.originalname  ?? "(none)",
    });

    let body = sanitizeBody(meta) as any;

    if (!body.title_en && !body.title_ar) {
      console.warn("[POST /projects] ✗ Rejected — title_en and title_ar are both empty");
      return res.status(400).json({ error: "title_en or title_ar is required" });
    }

    // ── Table readiness check ──────────────────────────────────────────────────
    try {
      await checkTable();
    } catch (err: any) {
      console.error("[POST /projects] ✗ Table check failed:", err);
      return res.status(500).json({ error: `Neon DB Error: ${err.message}` });
    }

    // ── A) Cloudinary uploads ──────────────────────────────────────────────────
    // Start with any URLs the frontend already resolved (URL-paste fields).
    // File uploads ALWAYS win and overwrite the pasted URL.
    const urls = {
      thumbnail_url:  (body.thumbnail_url  as string | null) || null,
      video_url:      (body.video_url      as string | null) || null,
      model_3d_url:   (body.model_3d_url   as string | null) || null,
      bom_url:        (body.bom_url        as string | null) || null,
      assets_zip_url: (body.assets_zip_url as string | null) || null,
    };

    try {
      if (files["thumbnail"]?.[0]) {
        console.log("[POST /projects] ▶ Uploading thumbnail to Cloudinary…");
        urls.thumbnail_url = await uploadBufferToCloudinary(files["thumbnail"][0].buffer, {
          resource_type: "image",
          folder: "infinity-tech",
        });
        console.log("[POST /projects] ✓ Thumbnail URL:", urls.thumbnail_url);
      }

      if (files["video"]?.[0]) {
        console.log("[POST /projects] ▶ Uploading video to Cloudinary…");
        urls.video_url = await uploadBufferToCloudinary(files["video"][0].buffer, {
          resource_type: "video",
          folder: "infinity-tech/videos",
        });
        console.log("[POST /projects] ✓ Video URL:", urls.video_url);
      }

      if (files["model_3d"]?.[0]) {
        console.log("[POST /projects] ▶ Uploading 3D model to Cloudinary…");
        urls.model_3d_url = await uploadBufferToCloudinary(files["model_3d"][0].buffer, {
          resource_type: "raw",
          folder: "infinity-tech/engineering",
        });
        console.log("[POST /projects] ✓ 3D model URL:", urls.model_3d_url);
      }

      if (files["bom_file"]?.[0]) {
        console.log("[POST /projects] ▶ Uploading BOM to Cloudinary…");
        urls.bom_url = await uploadBufferToCloudinary(files["bom_file"][0].buffer, {
          resource_type: "raw",
          folder: "infinity-tech/engineering",
        });
        console.log("[POST /projects] ✓ BOM URL:", urls.bom_url);
      }
    } catch (err: any) {
      console.error("[POST /projects] ✗ Cloudinary Error:", err);
      return res.status(500).json({ error: `Cloudinary Error: ${err.message}` });
    }

    // ── B) Merge Cloudinary URLs into the metadata body ────────────────────────
    body = { ...body, ...urls };
    console.log("[POST /projects] ▶ Media URLs resolved:", {
      thumbnail_url:  urls.thumbnail_url  ?? "(none)",
      video_url:      urls.video_url      ?? "(none)",
      model_3d_url:   urls.model_3d_url   ?? "(none)",
      bom_url:        urls.bom_url        ?? "(none)",
      assets_zip_url: urls.assets_zip_url ?? "(none)",
    });

    // ── Auto-translate missing bilingual fields ────────────────────────────────
    console.log("[POST /projects] ▶ Running auto-translate…");
    try {
      body = await autoTranslateFields(body);
    } catch (transErr: any) {
      console.warn("[POST /projects] ⚠ Auto-translate failed (non-fatal):", transErr.message);
    }
    console.log("[POST /projects] ✓ Auto-translate done");

    // ── C) Single INSERT into Neon ─────────────────────────────────────────────
    const payload = {
      ...body,
      tags:            Array.isArray(body.tags) ? body.tags : [],
      status:          body.status ?? "active",
      custom_sections: body.custom_sections ?? {},
      timeline:        body.timeline   ?? null,
      files:           body.files      ?? null,
      media:           body.media      ?? null,
      updates:         body.updates    ?? null,
      // Explicit NULL coercion — never store empty string in URL columns
      thumbnail_url:   urls.thumbnail_url  || null,
      video_url:       urls.video_url      || null,
      model_3d_url:    urls.model_3d_url   || null,
      bom_url:         urls.bom_url        || null,
      assets_zip_url:  urls.assets_zip_url || null,
    };

    console.log("[POST /projects] ▶ INSERT INTO projects:", {
      title_en:      payload.title_en,
      title_ar:      payload.title_ar,
      status:        payload.status,
      thumbnail_url: payload.thumbnail_url,
      video_url:     payload.video_url,
      model_3d_url:  payload.model_3d_url,
      bom_url:       payload.bom_url,
      tags:          payload.tags,
    });

    try {
      const [row] = await db.insert(projects).values(payload).returning();

      if (!row) throw new Error("INSERT returned no row — check DB constraints");

      console.log(`[POST /projects] ✓ Project saved — id=${row.id} title="${row.title_en}"`);
      return res.status(201).json({ project: row });

    } catch (err: any) {
      console.error("[POST /projects] ✗ Neon DB Error:", {
        message: err.message,
        code:    err.code,
        detail:  err.detail,
        hint:    err.hint,
        where:   err.where,
        stack:   err.stack?.split("\n").slice(0, 8).join("\n"),
      });
      return res.status(500).json({ error: `Neon DB Error: ${err.message}` });
    }
  });
});

// PUT /api/projects/:id — admin only (full replace)
router.put("/projects/:id", requireAdmin, async (req, res) => {
  try {
    let body = sanitizeBody(req.body) as any;
    if (Object.keys(body).length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }
    body = await autoTranslateFields(body);

    const [row] = await db.update(projects)
      .set({ ...body, updated_at: new Date() })
      .where(eq(projects.id, req.params.id))
      .returning();

    if (!row) return res.status(404).json({ error: "Project not found" });
    console.log(`[DB] PUT project ${req.params.id} — fields: ${Object.keys(body).join(", ")}`);
    res.json({ project: row });
  } catch (err: any) {
    console.error(`[DB] PUT /projects/${req.params.id} error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/projects/:id — admin only
router.patch("/projects/:id", requireAdmin, async (req, res) => {
  const id = req.params.id;
  console.log(`[PATCH /projects/${id}] ▶ Incoming fields:`, Object.keys(req.body));
  console.log(`[PATCH /projects/${id}] ▶ Media URLs:`, {
    thumbnail_url: req.body.thumbnail_url ?? "(unchanged)",
    video_url:     req.body.video_url     ?? "(unchanged)",
    model_3d_url:  req.body.model_3d_url  ?? "(unchanged)",
    bom_url:       req.body.bom_url       ?? "(unchanged)",
  });

  try {
    let body = sanitizeBody(req.body) as any;
    if (Object.keys(body).length === 0) {
      console.warn(`[PATCH /projects/${id}] ✗ No writable fields in body`);
      return res.status(400).json({ error: "No valid fields to update" });
    }

    console.log(`[PATCH /projects/${id}] ▶ Running auto-translate…`);
    body = await autoTranslateFields(body);
    console.log(`[PATCH /projects/${id}] ✓ Translate done`);

    console.log(`[PATCH /projects/${id}] ▶ UPDATE projects SET … — ${Object.keys(body).join(", ")}`);
    const [row] = await db.update(projects)
      .set({ ...body, updated_at: new Date() })
      .where(eq(projects.id, id))
      .returning();

    if (!row) {
      console.warn(`[PATCH /projects/${id}] ✗ Project not found`);
      return res.status(404).json({ error: "Project not found" });
    }

    console.log(`[PATCH /projects/${id}] ✓ Updated — id=${row.id}`);
    res.json({ project: row });
  } catch (err: any) {
    console.error(`[PATCH /projects/${id}] ✗ Error:`, {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack?.split("\n").slice(0, 5).join("\n"),
    });
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/translate — admin only
router.post("/projects/:id/translate", requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.select().from(projects).where(eq(projects.id, req.params.id));
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const fields = {
      title_en: existing.title_en,
      title_ar: existing.title_ar || "",
      description_en: existing.description_en,
      description_ar: existing.description_ar || "",
      overview_en: existing.overview_en,
      overview_ar: existing.overview_ar || "",
      problem_en: existing.problem_en,
      problem_ar: existing.problem_ar || "",
      solution_en: existing.solution_en,
      solution_ar: existing.solution_ar || "",
    } as any;

    const translated = await autoTranslateFields(fields);

    const [row] = await db.update(projects)
      .set({ ...translated, updated_at: new Date() })
      .where(eq(projects.id, req.params.id))
      .returning();

    res.json({ project: row, translated: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/projects/:id — admin only
router.delete("/projects/:id", requireAdmin, async (req, res) => {
  // ── MANUAL DELETE — only reachable by clicking "Delete Project" in the admin UI ──
  // This route requires the x-admin-pin header; it is never called automatically.
  console.warn(`[DELETE /projects/${req.params.id}] ⚠  Manual deletion requested — origin: ${req.headers.origin ?? "direct call"}`);
  try {
    const result = await db.delete(projects).where(eq(projects.id, req.params.id)).returning();
    if (result.length === 0) {
      console.warn(`[DELETE /projects/${req.params.id}] ✗ Project not found`);
      return res.status(404).json({ error: "Project not found" });
    }
    console.log(`[DELETE /projects/${req.params.id}] ✓ Project permanently deleted`);
    res.json({ success: true });
  } catch (err: any) {
    console.error(`[DELETE /projects/${req.params.id}] ✗ Error:`, err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:id/updates — public; returns the updates log array
router.get("/projects/:id/updates", async (req, res) => {
  try {
    const [row] = await db.select({ updates: projects.updates })
      .from(projects)
      .where(eq(projects.id, req.params.id));
    if (!row) return res.status(404).json({ error: "Project not found" });
    res.json({ updates: (row.updates as any[]) || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/updates — admin only; append a new update log entry
router.post("/projects/:id/updates", requireAdmin, async (req, res) => {
  try {
    const { message } = req.body as { message?: string };
    if (!message?.trim()) {
      return res.status(400).json({ error: "message is required" });
    }

    const [existing] = await db.select({ updates: projects.updates })
      .from(projects)
      .where(eq(projects.id, req.params.id));
    if (!existing) return res.status(404).json({ error: "Project not found" });

    const newEntry = { message: message.trim(), date: new Date().toISOString() };
    const currentUpdates = (existing.updates as any[]) || [];
    const updatedList = [newEntry, ...currentUpdates];

    const [row] = await db.update(projects)
      .set({ updates: updatedList, updated_at: new Date() })
      .where(eq(projects.id, req.params.id))
      .returning();

    res.status(201).json({ update: newEntry, updates: row.updates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/engineering-files — admin only
// Accepts multipart/form-data with two optional file fields:
//   model_3d  — .glb or .step 3D model (resource_type: raw)
//   bom_file  — .pdf or .xlsx bill of materials (resource_type: raw)
// Uploads each present file to Cloudinary, then saves the URLs to the DB row.
// Returns the full updated project row so the frontend can immediately reflect both URLs.
router.post("/projects/:id/engineering-files", requireAdmin, (req: any, res: any) => {
  engineeringUpload(req, res, async (multerErr: any) => {
    if (multerErr) {
      console.error(`[Engineering] ✗ Multer error for ${req.params.id}:`, multerErr.message);
      return res.status(400).json({ error: `File upload error: ${multerErr.message}` });
    }

    const id = req.params.id;
    const files = (req.files ?? {}) as Record<string, Express.Multer.File[]>;

    // Verify at least one file was sent
    const model3dFile = files["model_3d"]?.[0];
    const bomFile     = files["bom_file"]?.[0];

    if (!model3dFile && !bomFile) {
      return res.status(400).json({ error: "No engineering files provided (expected model_3d or bom_file)" });
    }

    console.log(`[Engineering] ▶ Project ${id} — received files:`, {
      model_3d: model3dFile ? `${model3dFile.originalname} (${(model3dFile.size / 1024 / 1024).toFixed(2)} MB)` : "(none)",
      bom_file: bomFile     ? `${bomFile.originalname} (${(bomFile.size / 1024 / 1024).toFixed(2)} MB)` : "(none)",
    });

    const dbUpdates: Record<string, string | null> = {};

    // ── Upload 3D model ────────────────────────────────────────────────────────
    if (model3dFile) {
      try {
        console.log(`[Engineering] ▶ Uploading 3D model to Cloudinary — resource_type: raw`);
        const url = await uploadBufferToCloudinary(model3dFile.buffer, {
          resource_type: "raw",
          folder: "infinity-tech/engineering",
        });
        dbUpdates.model_3d_url = url;
        console.log(`[Engineering] ✓ 3D model URL: ${url}`);
      } catch (err: any) {
        console.error("[Engineering] ✗ 3D model Cloudinary upload failed:", err);
        return res.status(502).json({ error: `3D model upload failed: ${err.message}` });
      }
    }

    // ── Upload BOM ─────────────────────────────────────────────────────────────
    if (bomFile) {
      try {
        console.log(`[Engineering] ▶ Uploading BOM to Cloudinary — resource_type: raw`);
        const url = await uploadBufferToCloudinary(bomFile.buffer, {
          resource_type: "raw",
          folder: "infinity-tech/engineering",
        });
        dbUpdates.bom_url = url;
        console.log(`[Engineering] ✓ BOM URL: ${url}`);
      } catch (err: any) {
        console.error("[Engineering] ✗ BOM Cloudinary upload failed:", err);
        return res.status(502).json({ error: `BOM upload failed: ${err.message}` });
      }
    }

    // ── Write URLs to DB ───────────────────────────────────────────────────────
    try {
      const [row] = await db.update(projects)
        .set({ ...dbUpdates, updated_at: new Date() })
        .where(eq(projects.id, id))
        .returning();

      if (!row) {
        return res.status(404).json({ error: "Project not found" });
      }

      console.log(`[Engineering] ✓ DB updated — project ${id}`, {
        model_3d_url: row.model_3d_url ?? "(none)",
        bom_url:      row.bom_url      ?? "(none)",
      });

      // Return the full row so the frontend can immediately update its state
      res.status(201).json({ project: row });
    } catch (err: any) {
      console.error(`[Engineering] ✗ DB write failed for ${id}:`, err);
      res.status(500).json({ error: err.message });
    }
  });
});

// POST /api/projects/upload-signature — admin only (images)
router.post("/projects/upload-signature", requireAdmin, async (req, res) => {
  try {
    const { folder, publicId } = req.body as { folder?: string; publicId?: string };
    const sig = getUploadSignature(folder || "infinity-tech", publicId, "image");
    res.json(sig);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/video-upload-signature — admin only (videos)
router.post("/projects/video-upload-signature", requireAdmin, async (req, res) => {
  try {
    const { folder, publicId } = req.body as { folder?: string; publicId?: string };
    const sig = getUploadSignature(folder || "infinity-tech/videos", publicId, "video");
    res.json(sig);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/asset-upload-signature — admin only (all types: image | video | raw)
// resource_type: "image" for thumbnails, "video" for demos, "raw" for 3D models (GLB/STEP)
router.post("/projects/asset-upload-signature", requireAdmin, async (req, res) => {
  try {
    const { folder, publicId, resourceType } = req.body as {
      folder?: string;
      publicId?: string;
      resourceType?: "image" | "video" | "raw";
    };
    const type = (resourceType ?? "image") as "image" | "video" | "raw";
    const defaultFolder =
      type === "video" ? "infinity-tech/videos" :
      type === "raw"   ? "infinity-tech/models"  : "infinity-tech";
    const sig = getUploadSignature(folder ?? defaultFolder, publicId, type);
    res.json(sig);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
