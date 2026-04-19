import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  const pin = req.headers["x-admin-pin"];
  const validPin = process.env.ADMIN_PIN || "admin2024";
  if (!pin || pin !== validPin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Allowed MIME types ──────────────────────────────────────────────────────
// Images: standard raster formats
// Engineering files: 3D models (GLB, STEP), documentation (PDF), BOM (Excel), archives (ZIP)
// Videos: MP4, WebM, OGG for demo clips
const ALLOWED_MIME = new Set([
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  // 3D models
  "model/gltf-binary",         // .glb
  "model/step",                // .step / .stp
  "application/octet-stream",  // catch-all for .glb / .step when browser sends generic type
  // Documents / BOM
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel",  // .xls
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-zip",
  // Videos
  "video/mp4",
  "video/webm",
  "video/ogg",
]);

// Extensions that browsers routinely misreport as application/octet-stream.
// We accept them regardless of stated MIME type.
const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif",
  ".glb", ".step", ".stp",
  ".pdf", ".xlsx", ".xls",
  ".zip",
  ".mp4", ".webm", ".ogg",
]);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || ".bin";
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  // 50 MB — covers large STEP / GLB engineering files
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeOk = ALLOWED_MIME.has(file.mimetype);
    const extOk  = ALLOWED_EXTENSIONS.has(ext);

    if (mimeOk || extOk) {
      console.log(`[Upload] ✓ File accepted — name="${file.originalname}" mime="${file.mimetype}" ext="${ext}"`);
      cb(null, true);
    } else {
      console.warn(`[Upload] ✗ File rejected — name="${file.originalname}" mime="${file.mimetype}" ext="${ext}"`);
      cb(new Error(`File type not allowed: ${file.mimetype} (${ext}). Allowed: images, GLB, STEP, PDF, XLSX, ZIP, video.`));
    }
  },
});

router.post("/upload", requireAdmin, upload.single("file"), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const url = `/uploads/${req.file.filename}`;
  console.log(`[Upload] ✓ Saved locally — ${req.file.originalname} → ${url} (${(req.file.size / 1024).toFixed(1)} KB)`);
  return res.status(201).json({ url, filename: req.file.filename });
});

export default router;
