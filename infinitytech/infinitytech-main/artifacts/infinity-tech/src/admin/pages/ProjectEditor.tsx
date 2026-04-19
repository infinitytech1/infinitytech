import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useStore, adminToDb } from "@/admin/data/store";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type {
  AdminProject, ProjectStatus, FileType, UpdateType, ProjectFile, ProjectUpdate, CustomSection,
} from "@/admin/data/types";
import {
  ArrowLeft, Save, Plus, Trash2, Upload, FileText, Image,
  GitCommit, Calendar, Lock, X,
  CheckCircle2, AlertCircle, FolderArchive, FileCode,
  Box, Film, ImagePlus, Loader2, ExternalLink, Layers,
  GripVertical, ChevronDown, ChevronUp,
} from "lucide-react";
import { Link } from "wouter";
import BilingualField from "@/admin/components/BilingualField";
import CustomSelect from "@/admin/components/CustomSelect";

const COMMIT_TYPE_COLOR: Record<string, string> = {
  create: "bg-chart-4 text-white",
  update: "bg-primary text-primary-foreground",
  release: "bg-chart-2 text-white",
  fix: "bg-chart-3 text-foreground",
  design: "bg-chart-5 text-white",
};
const FILE_TYPE_ICON: Record<FileType, any> = {
  gerbers: FolderArchive,
  schematic: FileText,
  model3d: Box,
  source: FileCode,
};
const FILE_TYPE_LABEL: Record<FileType, string> = {
  gerbers: "Gerber Files",
  schematic: "Schematic (PDF/Image)",
  model3d: "3D Model (STEP/OBJ)",
  source: "Source Code",
};
const UPDATE_TYPE_COLOR: Record<UpdateType, string> = {
  release: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  feature: "bg-primary/10 text-primary border-primary/20",
  fix: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  design: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  test: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  note: "bg-muted text-muted-foreground border-border",
};

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "active",    label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived",  label: "Archived" },
];
const UPDATE_TYPES: UpdateType[] = ["release", "feature", "fix", "design", "test", "note"];
const LANG_OPTIONS: { value: string; label: string }[] = [
  { value: "c",          label: "C" },
  { value: "cpp",        label: "C++" },
  { value: "python",     label: "Python" },
  { value: "typescript", label: "TypeScript" },
  { value: "rust",       label: "Rust" },
  { value: "vhdl",       label: "VHDL" },
  { value: "assembly",   label: "Assembly" },
  { value: "other",      label: "Other" },
];

type FormData = Omit<AdminProject, "id" | "createdAt" | "updatedAt" | "commits" | "views" | "downloads">;

const EMPTY_PROJECT: FormData = {
  title: "", titleAr: "",
  description: "", descriptionAr: "",
  overview: "", overviewAr: "",
  tags: [], status: "active",
  language: "c", githubUrl: "",
  liveUrl: "", category: "",
  thumbnailUrl: "",
  videoUrl: "",
  model3dUrl: "",
  bomUrl: "",
  customSections: [],
  timeline: [], files: [], media: [], updates: [],
};

/** Returns true for file extensions that must be uploaded as raw (not image/video). */
function isEngineeringFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  return ["glb", "step", "stp", "pdf", "xlsx", "xls", "zip"].includes(ext);
}

interface ProjectEditorProps {
  mode: "create" | "edit";
  projectId?: string;
}

type Tab = "content" | "files" | "media" | "updates" | "history";

function TabButton({ label, active, onClick, badge }: {
  label: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1.5 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
}

function Field({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      {sub && <p className="text-xs text-muted-foreground mb-1.5">{sub}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full bg-muted/30 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all";
const textareaCls = `${inputCls} resize-none`;

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function SectionCard({
  section,
  onUpdate,
  onRemove,
}: {
  section: CustomSection;
  onUpdate: (s: CustomSection) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="border border-border rounded-xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/40"
          value={section.titleEn}
          onChange={e => onUpdate({ ...section, titleEn: e.target.value })}
          placeholder="Section title (e.g. Technical Details)"
        />
        <input
          className="flex-1 bg-transparent border-none outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 text-right"
          value={section.titleAr}
          onChange={e => onUpdate({ ...section, titleAr: e.target.value })}
          placeholder="عنوان القسم"
          dir="rtl"
        />
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-md text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1.5">Content (EN)</p>
                <textarea
                  className={textareaCls}
                  rows={5}
                  value={section.contentEn}
                  onChange={e => onUpdate({ ...section, contentEn: e.target.value })}
                  placeholder="Write section content in English…"
                  dir="ltr"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest mb-1.5 text-right">المحتوى (AR)</p>
                <textarea
                  className={`${textareaCls} text-right`}
                  rows={5}
                  value={section.contentAr}
                  onChange={e => onUpdate({ ...section, contentAr: e.target.value })}
                  placeholder="اكتب محتوى القسم بالعربية…"
                  dir="rtl"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ProjectEditor({ mode, projectId }: ProjectEditorProps) {
  const [, navigate] = useLocation();
  const {
    getProject, createProject, updateProject,
    addFile, removeFile, addMedia, removeMedia,
    addUpdate, removeUpdate, saving, error: storeError,
  } = useStore();
  const { toast } = useToast();

  const existing = projectId ? getProject(projectId) : null;

  function toFormData(p: AdminProject): FormData {
    return {
      title: p.title, titleAr: p.titleAr,
      description: p.description, descriptionAr: p.descriptionAr,
      overview: p.overview, overviewAr: p.overviewAr,
      tags: p.tags, status: p.status,
      language: p.language, githubUrl: p.githubUrl,
      liveUrl: p.liveUrl ?? "", category: p.category ?? "",
      thumbnailUrl: p.thumbnailUrl ?? "",
      videoUrl: p.videoUrl ?? "",
      model3dUrl: p.model3dUrl ?? "",
      bomUrl: p.bomUrl ?? "",
      customSections: p.customSections ?? [],
      timeline: p.timeline, files: p.files, media: p.media, updates: p.updates,
    };
  }

  /** Map a raw DB row (from GET /api/projects/:id) into FormData */
  function rowToFormData(row: Record<string, any>): FormData {
    const rawSections = row.custom_sections;
    const customSections: CustomSection[] = Array.isArray(rawSections) ? rawSections : [];
    return {
      title: row.title_en ?? "",
      titleAr: row.title_ar ?? "",
      description: row.description_en ?? "",
      descriptionAr: row.description_ar ?? "",
      overview: row.overview_en ?? "",
      overviewAr: row.overview_ar ?? "",
      tags: row.tags ?? [],
      status: (row.status ?? "active") as ProjectStatus,
      language: row.language ?? "c",
      githubUrl: row.github_url ?? "",
      liveUrl: row.live_link ?? "",
      category: row.category ?? "",
      thumbnailUrl: row.thumbnail_url ?? "",
      videoUrl: row.video_url ?? "",
      model3dUrl: row.model_3d_url ?? "",
      bomUrl: row.bom_url ?? "",
      customSections,
      timeline: Array.isArray(row.timeline) ? row.timeline : [],
      files: Array.isArray(row.files) ? row.files : [],
      media: Array.isArray(row.media) ? row.media : [],
      updates: Array.isArray(row.updates) ? row.updates : [],
    };
  }

  const [formReady, setFormReady] = useState(mode === "create");
  const [form, setForm] = useState<FormData>(existing ? toFormData(existing) : EMPTY_PROJECT);
  /** Covers the full save pipeline: uploads + DB write. Disables the Save button. */
  const [isBusy, setIsBusy] = useState(false);

  /**
   * On mount in edit mode: always fetch the latest project data from the API.
   * This ensures the form is populated even when navigating directly to the URL
   * (bypassing the store's lazy-loaded list) and always shows fresh DB data.
   */
  useEffect(() => {
    if (mode !== "edit" || !projectId) return;

    const pin = localStorage.getItem("it-admin-pin") || "admin2024";
    fetch(`/api/projects/${projectId}`, {
      headers: { "x-admin-pin": pin, "Content-Type": "application/json" },
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ project: row }) => {
        if (row) {
          setForm(rowToFormData(row));
        }
      })
      .catch(err => console.error("[ProjectEditor] failed to fetch project:", err))
      .finally(() => setFormReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, mode]);
  const [tab, setTab] = useState<Tab>("content");
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [commitMsg, setCommitMsg] = useState("");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailUploadProgress, setThumbnailUploadProgress] = useState(0);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLocalUrl, setVideoLocalUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // ── Engineering files (3D model + BOM) ─────────────────────────────────────
  const [model3dFile, setModel3dFile] = useState<File | null>(null);
  const [model3dUploading, setModel3dUploading] = useState(false);
  const [model3dUploadProgress, setModel3dUploadProgress] = useState(0);
  const [model3dError, setModel3dError] = useState<string | null>(null);
  const model3dInputRef = useRef<HTMLInputElement>(null);

  const [bomFile, setBomFile] = useState<File | null>(null);
  const [bomUploading, setBomUploading] = useState(false);
  const [bomUploadProgress, setBomUploadProgress] = useState(0);
  const [bomError, setBomError] = useState<string | null>(null);
  const bomInputRef = useRef<HTMLInputElement>(null);

  const [addFileOpen, setAddFileOpen] = useState(false);
  const [fileForm, setFileForm] = useState<Omit<ProjectFile, "id" | "uploadedAt">>({
    name: "", type: "gerbers", description: "", size: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addMediaUrl, setAddMediaUrl] = useState("");
  const [addMediaCaption, setAddMediaCaption] = useState("");
  const [addMediaType, setAddMediaType] = useState<"image" | "video">("image");

  const [addUpdateOpen, setAddUpdateOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState<Omit<ProjectUpdate, "id">>({
    date: new Date().toISOString().split("T")[0],
    version: "", title: "", titleAr: "", desc: "", descAr: "",
    type: "feature", adminOnly: false,
  });

  const currentProject = projectId ? getProject(projectId) : null;

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function handleThumbnailPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailError(null);
    const reader = new FileReader();
    reader.onloadend = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function clearThumbnailFile() {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setThumbnailError(null);
    setThumbnailUploadProgress(0);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  }

  /**
   * Upload a file directly to Cloudinary using a server-issued signature.
   * Always uses resource_type=auto so images, videos, and 3D model files
   * (GLB / STEP / OBJ / ZIP) are all handled by a single code path.
   */
  async function uploadToCloudinary(
    file: File,
    _resourceType: "image" | "video" | "raw",  // kept for signature-folder routing only
    folder: string,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const pin = localStorage.getItem("it-admin-pin") || "admin2024";

    console.log(`[Upload] ▶ Starting — file="${file.name}" size=${(file.size / 1024).toFixed(1)}KB folder="${folder}"`);

    // STEP 1 — Get a fresh signed params object from the backend
    const sigRes = await fetch("/api/projects/asset-upload-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-pin": pin },
      body: JSON.stringify({ resourceType: _resourceType, folder }),
    });
    if (!sigRes.ok) {
      const body = await sigRes.json().catch(() => ({}));
      const msg = (body as any).error ?? "Failed to get upload signature";
      console.error("[Upload] ✗ Signature request failed:", msg);
      throw new Error(msg);
    }
    const sig = await sigRes.json();
    console.log("[Upload] ✓ Signature obtained — timestamp:", sig.timestamp);

    // STEP 2 — Build the multipart form (params must exactly match signed set)
    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", sig.apiKey);
    fd.append("timestamp", String(sig.timestamp));
    fd.append("signature", sig.signature);
    fd.append("folder", sig.folder);

    // STEP 3 — Upload via XHR with progress tracking.
    //           Use resource_type=auto — handles images, videos, and raw 3D files.
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`,
      );

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
          if (pct % 25 === 0) {
            console.log(`[Upload] … ${pct}% complete`);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText) as { secure_url: string; resource_type: string };
          let url = data.secure_url;
          // Inject auto-quality / auto-format optimisation transforms for media
          if (url.includes("cloudinary.com") && url.includes("/upload/")) {
            url = url.replace("/upload/", "/upload/f_auto,q_auto/");
          }
          console.log("[Upload] ✓ Cloudinary upload success:", url);
          resolve(url);
        } else {
          let msg = "Cloudinary upload failed";
          try {
            const err = JSON.parse(xhr.responseText);
            msg = err?.error?.message ?? msg;
          } catch {}
          console.error("[Upload] ✗ Cloudinary responded with error:", xhr.status, msg);
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => {
        console.error("[Upload] ✗ Network error");
        reject(new Error("Network error during upload"));
      };
      xhr.ontimeout = () => {
        console.error("[Upload] ✗ Upload timed out");
        reject(new Error("Upload timed out"));
      };
      xhr.send(fd);
    });
  }

  async function uploadThumbnail(file: File): Promise<string> {
    return uploadToCloudinary(file, "image", "infinity-tech", (pct) => setThumbnailUploadProgress(pct));
  }

  function handleVideoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (videoLocalUrl) URL.revokeObjectURL(videoLocalUrl);
    setVideoFile(file);
    setVideoLocalUrl(URL.createObjectURL(file));
    setVideoError(null);
    setVideoUploadProgress(0);
  }

  function clearVideo() {
    setField("videoUrl", "");
    setVideoFile(null);
    if (videoLocalUrl) URL.revokeObjectURL(videoLocalUrl);
    setVideoLocalUrl(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    setVideoError(null);
    setVideoUploadProgress(0);
  }

  async function handleVideoUpload() {
    if (!videoFile) return;
    setVideoUploading(true);
    setVideoError(null);
    setVideoUploadProgress(0);
    try {
      const url = await uploadToCloudinary(
        videoFile,
        "video",
        "infinity-tech/videos",
        (pct) => setVideoUploadProgress(pct),
      );
      setField("videoUrl", url);
      if (videoLocalUrl) URL.revokeObjectURL(videoLocalUrl);
      setVideoFile(null);
      setVideoLocalUrl(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
      setVideoUploadProgress(100);
    } catch (err: any) {
      setVideoError(err.message ?? "Upload failed");
    } finally {
      setVideoUploading(false);
    }
  }

  async function handleSave() {
    if (isBusy) return;
    setSaveError(null);
    setSaved(false);
    setIsBusy(true);
    const finalForm = { ...form };

    // ── STEP A — Console snapshot ─────────────────────────────────────────────
    console.log("[Save] ▶ Pipeline start", {
      mode,
      projectId,
      title:               finalForm.title         || "(empty)",
      titleAr:             finalForm.titleAr        || "(empty)",
      status:              finalForm.status,
      tags:                finalForm.tags,
      thumbnailUrl:        finalForm.thumbnailUrl   || "(empty)",
      videoUrl:            finalForm.videoUrl       || "(empty)",
      model3dUrl:          finalForm.model3dUrl     || "(empty)",
      bomUrl:              finalForm.bomUrl         || "(empty)",
      hasPendingThumbnail: !!thumbnailFile,
      hasPendingVideo:     !!videoFile,
      hasPending3dFile:    !!model3dFile,
      hasPendingBomFile:   !!bomFile,
      customSections:      finalForm.customSections?.length ?? 0,
    });

    // ── Front-end validation ──────────────────────────────────────────────────
    if (!finalForm.title && !finalForm.titleAr) {
      setSaveError("Title (English or Arabic) is required before saving.");
      setIsBusy(false);
      return;
    }

    const pin = localStorage.getItem("it-admin-pin") || "admin2024";

    // ═══════════════════════════════════════════════════════════════════════════
    // ── CREATE PATH — single FormData POST; backend handles ALL Cloudinary uploads
    // ═══════════════════════════════════════════════════════════════════════════
    if (mode === "create") {
      // Mark uploading states for overlay feedback
      if (thumbnailFile) { setThumbnailUploading(true); setThumbnailUploadProgress(0); }
      if (videoFile)     { setVideoUploading(true);     setVideoUploadProgress(0); }
      if (model3dFile)   { setModel3dUploading(true);   setModel3dUploadProgress(0); }
      if (bomFile)       { setBomUploading(true);        setBomUploadProgress(0); }

      try {
        // Serialize all metadata (snake_case) as a JSON string in the "meta" field.
        // adminToDb() converts AdminProject camelCase → DB snake_case and NULL-coerces
        // empty URL strings so the backend INSERT never stores empty strings in URL cols.
        const meta = adminToDb(finalForm);
        const fd = new FormData();
        fd.append("meta", JSON.stringify(meta));

        if (thumbnailFile) fd.append("thumbnail", thumbnailFile, thumbnailFile.name);
        if (videoFile)     fd.append("video",     videoFile,     videoFile.name);
        if (model3dFile)   fd.append("model_3d",  model3dFile,  model3dFile.name);
        if (bomFile)       fd.append("bom_file",  bomFile,      bomFile.name);

        // ── Log every FormData key so files are visible in the console ─────────
        const fdKeys: string[] = [];
        for (const k of fd.keys()) fdKeys.push(k);
        console.log("[Save] ▶ FormData keys before POST /api/projects:", fdKeys);
        // Expected: ["meta"] + any subset of ["thumbnail","video","model_3d","bom_file"]

        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "x-admin-pin": pin },
          // Do NOT set Content-Type — the browser adds multipart boundary automatically
          body: fd,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg = (json as any).error ?? `Server error ${res.status}`;
          console.error("[Save] ✗ POST /api/projects failed:", errMsg);
          throw new Error(errMsg);
        }

        const savedId: string = (json as any).project?.id;
        console.log("[Save] ✓ Server responded 201 — project id:", savedId);

        // ── Clear all pending file states ──────────────────────────────────────
        clearThumbnailFile();
        if (videoLocalUrl) URL.revokeObjectURL(videoLocalUrl);
        setVideoFile(null); setVideoLocalUrl(null);
        if (videoInputRef.current) videoInputRef.current.value = "";
        setModel3dFile(null); if (model3dInputRef.current) model3dInputRef.current.value = "";
        setBomFile(null);    if (bomInputRef.current)    bomInputRef.current.value = "";

        // ── Success toast + navigate ───────────────────────────────────────────
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        toast({ title: "Project saved!", description: `"${finalForm.title || finalForm.titleAr}" was created successfully.` });
        navigate(`/admin/projects/${savedId}`);

      } catch (err: any) {
        const msg = err.message ?? "Save failed";
        console.error("[Save] ✗ CREATE failed:", err);
        setSaveError(msg);
        toast({ title: "Save failed", description: msg, variant: "destructive" });
      } finally {
        setThumbnailUploading(false); setVideoUploading(false);
        setModel3dUploading(false);   setBomUploading(false);
        setIsBusy(false);
      }
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ── EDIT PATH — direct Cloudinary for thumbnail/video; separate engineering
    //               endpoint for 3D model/BOM; PATCH with resolved URLs
    // ═══════════════════════════════════════════════════════════════════════════
    let editForm = { ...finalForm };

    try {
      // ── STEP B1 — Upload thumbnail directly to Cloudinary ────────────────────
      if (thumbnailFile) {
        console.log("[Save] ▶ Uploading thumbnail:", thumbnailFile.name);
        setThumbnailUploading(true);
        try {
          const url = await uploadToCloudinary(thumbnailFile, "image", "infinity-tech", (pct) => setThumbnailUploadProgress(pct));
          console.log("[Save] ✓ Thumbnail URL:", url);
          editForm = { ...editForm, thumbnailUrl: url };
          setField("thumbnailUrl", url);
          clearThumbnailFile();
        } catch (err: any) {
          const msg = `Cloudinary Upload Failed: ${err.message ?? "Image upload error"}`;
          console.error("[Save] ✗ Thumbnail upload failed:", err);
          setThumbnailError(msg); setSaveError(msg); setThumbnailUploading(false); setIsBusy(false);
          toast({ title: "Thumbnail upload failed", description: msg, variant: "destructive" });
          return;
        }
        setThumbnailUploading(false);
      }

      // ── STEP B2 — Upload video directly to Cloudinary ───────────────────────
      if (videoFile) {
        console.log("[Save] ▶ Uploading video:", videoFile.name);
        setVideoUploading(true); setVideoUploadProgress(0);
        try {
          const url = await uploadToCloudinary(videoFile, "video", "infinity-tech/videos", (pct) => setVideoUploadProgress(pct));
          console.log("[Save] ✓ Video URL:", url);
          editForm = { ...editForm, videoUrl: url };
          setField("videoUrl", url);
          if (videoLocalUrl) URL.revokeObjectURL(videoLocalUrl);
          setVideoFile(null); setVideoLocalUrl(null);
          if (videoInputRef.current) videoInputRef.current.value = "";
          setVideoUploadProgress(100);
        } catch (err: any) {
          const msg = `Cloudinary Upload Failed: ${err.message ?? "Video upload error"}`;
          console.error("[Save] ✗ Video upload failed:", err);
          setVideoError(msg); setSaveError(msg); setVideoUploading(false); setIsBusy(false);
          toast({ title: "Video upload failed", description: msg, variant: "destructive" });
          return;
        }
        setVideoUploading(false);
      }

      // ── STEP B3/B4 — Engineering files through backend endpoint ─────────────
      // Send model_3d / bom_file to /api/projects/:id/engineering-files BEFORE
      // the PATCH so editForm carries the confirmed Cloudinary URLs into the DB write.
      if ((model3dFile || bomFile) && projectId) {
        const engFd = new FormData();
        if (model3dFile) { engFd.append("model_3d", model3dFile, model3dFile.name); setModel3dUploading(true); setModel3dUploadProgress(0); }
        if (bomFile)     { engFd.append("bom_file",  bomFile,    bomFile.name);     setBomUploading(true);     setBomUploadProgress(0); }

        const engKeys: string[] = [];
        for (const k of engFd.keys()) engKeys.push(k);
        console.log("[Save] ▶ FormData keys before POST /engineering-files:", engKeys);

        const engRes = await fetch(`/api/projects/${projectId}/engineering-files`, {
          method: "POST",
          headers: { "x-admin-pin": pin },
          body: engFd,
        });

        if (!engRes.ok) {
          const body = await engRes.json().catch(() => ({}));
          const msg = (body as any).error ?? `Engineering upload failed (HTTP ${engRes.status})`;
          console.error("[Save] ✗ Engineering-files endpoint error:", msg);
          setModel3dUploading(false); setBomUploading(false); setIsBusy(false);
          setSaveError(msg);
          toast({ title: "Engineering file upload failed", description: msg, variant: "destructive" });
          return;
        }

        const { project: row } = await engRes.json();
        console.log("[Save] ✓ Engineering files saved:", { model_3d_url: row.model_3d_url ?? "(none)", bom_url: row.bom_url ?? "(none)" });

        if (row.model_3d_url) { editForm = { ...editForm, model3dUrl: row.model_3d_url }; setField("model3dUrl", row.model_3d_url); setModel3dFile(null); if (model3dInputRef.current) model3dInputRef.current.value = ""; }
        if (row.bom_url)      { editForm = { ...editForm, bomUrl: row.bom_url };           setField("bomUrl",     row.bom_url);     setBomFile(null);    if (bomInputRef.current)    bomInputRef.current.value = ""; }
        setModel3dUploading(false); setBomUploading(false);
        setModel3dUploadProgress(100); setBomUploadProgress(100);
      }

      // ── STEP C — PATCH project with all resolved URLs ────────────────────────
      console.log("[Save] ▶ Calling updateProject — waiting for server 200…", {
        thumbnailUrl: editForm.thumbnailUrl || "(empty)",
        videoUrl:     editForm.videoUrl     || "(empty)",
        model3dUrl:   editForm.model3dUrl   || "(empty)",
        bomUrl:       editForm.bomUrl       || "(empty)",
      });

      await updateProject(projectId!, editForm, commitMsg || undefined);
      console.log("[Save] ✓ Server responded 200 — project id:", projectId);
      setCommitMsg("");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: "Project updated!", description: `"${editForm.title || editForm.titleAr}" saved successfully.` });

    } catch (err: any) {
      const msg = err.message ?? "Save failed";
      console.error("[Save] ✗ EDIT failed — full error:", err);
      setSaveError(msg);
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setIsBusy(false);
    }
  }

  function handleTag(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !form.tags.includes(tag)) {
        setField("tags", [...form.tags, tag]);
      }
      setTagInput("");
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileForm(f => ({
      ...f,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
    }));
  }

  async function submitFile() {
    if (!projectId || !fileForm.name) return;
    await addFile(projectId, fileForm);
    setFileForm({ name: "", type: "gerbers", description: "", size: "" });
    setAddFileOpen(false);
  }

  async function submitMedia() {
    if (!projectId || !addMediaUrl) return;
    await addMedia(projectId, { type: addMediaType, url: addMediaUrl, caption: addMediaCaption, captionAr: "" });
    setAddMediaUrl("");
    setAddMediaCaption("");
  }

  async function submitUpdate() {
    if (!projectId || !updateForm.title) return;
    await addUpdate(projectId, updateForm);
    setAddUpdateOpen(false);
    setUpdateForm({
      date: new Date().toISOString().split("T")[0],
      version: "", title: "", titleAr: "", desc: "", descAr: "",
      type: "feature", adminOnly: false,
    });
  }

  function addSection() {
    const newSection: CustomSection = {
      id: genId(), titleEn: "", titleAr: "", contentEn: "", contentAr: "",
    };
    setField("customSections", [...form.customSections, newSection]);
  }

  function updateSection(id: string, updated: CustomSection) {
    setField("customSections", form.customSections.map(s => s.id === id ? updated : s));
  }

  function removeSection(id: string) {
    setField("customSections", form.customSections.filter(s => s.id !== id));
  }

  // Show loading state while fetching project data from the API
  if (!formReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading project…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">

      {/* ── Full-screen save/upload overlay ──────────────────────────────────
          Rendered whenever isBusy is true (covers uploads + DB write).
          pointer-events covers everything so no interaction slips through. */}
      {isBusy && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5"
          style={{ background: "rgba(10,16,25,0.88)", backdropFilter: "blur(10px)", pointerEvents: "all" }}
        >
          <Loader2 className="w-14 h-14 animate-spin text-primary" />

          <div className="text-center space-y-1">
            <p className="text-xl font-bold text-foreground tracking-tight">
              {thumbnailUploading
                ? "Uploading Image…"
                : videoUploading
                ? "Uploading Video…"
                : model3dUploading
                ? "Uploading 3D Model…"
                : bomUploading
                ? "Uploading BOM File…"
                : saving
                ? "Saving to Database…"
                : "Uploading Assets…"}
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait — do not close or refresh this page
            </p>
          </div>

          {/* Progress bar — shown while any file is uploading */}
          {(thumbnailUploading || videoUploading || model3dUploading || bomUploading) && (() => {
            const pct = thumbnailUploading ? thumbnailUploadProgress
                      : videoUploading    ? videoUploadProgress
                      : model3dUploading  ? model3dUploadProgress
                      : bomUploadProgress;
            return (
              <div className="w-56">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-200"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-1.5">
                  {pct}% complete
                </p>
              </div>
            );
          })()}

          {saving && (
            <p className="text-xs text-muted-foreground animate-pulse">Writing to database…</p>
          )}
        </div>
      )}

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 border-b border-border px-6 py-3 flex items-center gap-4"
        style={{ background: "rgba(10,16,25,0.92)", backdropFilter: "blur(16px)" }}
      >
        <Link href="/admin/projects">
          <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Projects
          </button>
        </Link>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-sm font-semibold text-foreground truncate flex-1">
          {mode === "create" ? "New Project" : (form.title || "Edit Project")}
        </h1>

        {mode === "edit" && (
          <input
            value={commitMsg}
            onChange={e => setCommitMsg(e.target.value)}
            placeholder="Commit message (optional)"
            className="text-xs bg-muted/40 border border-border rounded-md px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 w-52 font-mono"
          />
        )}

        <button
          onClick={handleSave}
          disabled={isBusy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
            saved
              ? "bg-emerald-500 text-white"
              : saveError
              ? "bg-red-500/80 text-white"
              : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg hover:shadow-primary/25"
          }`}
        >
          {thumbnailUploading
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading image…</>
            : videoUploading
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading video…</>
            : model3dUploading
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading 3D…</>
            : bomUploading
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading BOM…</>
            : saving
            ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            : saveError
            ? <><AlertCircle className="w-4 h-4" /> Error — retry?</>
            : <><Save className="w-4 h-4" /> {mode === "create" ? "Create Project" : "Save Changes"}</>
          }
        </button>
      </div>

      {saveError && (
        <div className="px-6 pt-3">
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {saveError}
          </p>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="border-b border-border px-6 flex gap-0 overflow-x-auto scrollbar-none">
        <TabButton label="Content"  active={tab === "content"}  onClick={() => setTab("content")} />
        <TabButton label="Files"    active={tab === "files"}    onClick={() => setTab("files")}   badge={currentProject?.files.length} />
        <TabButton label="Media"    active={tab === "media"}    onClick={() => setTab("media")}   badge={currentProject?.media.length} />
        <TabButton label="Updates"  active={tab === "updates"}  onClick={() => setTab("updates")} badge={currentProject?.updates.length} />
        {mode === "edit" && (
          <TabButton label="History" active={tab === "history"} onClick={() => setTab("history")} badge={currentProject?.commits.length} />
        )}
      </div>

      {/* ── Tab content ── */}
      <div className="p-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── CONTENT TAB ── */}
          {tab === "content" && (
            <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-7">

              <BilingualField
                label="Title"
                enValue={form.title}
                arValue={form.titleAr}
                onEnChange={v => setField("title", v)}
                onArChange={v => setField("titleAr", v)}
                enPlaceholder="Neural PCB Controller"
                arPlaceholder="وحدة تحكم PCB العصبية"
              />

              <BilingualField
                label="Short Description"
                enValue={form.description}
                arValue={form.descriptionAr}
                onEnChange={v => setField("description", v)}
                onArChange={v => setField("descriptionAr", v)}
                multiline rows={3}
                enPlaceholder="Brief project description…"
                arPlaceholder="وصف مختصر للمشروع…"
              />

              {/* ── Cover Image ── */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Cover Image
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Upload an image or paste a URL. Displayed at 16:9 ratio without distortion.
                </p>

                {/* 16:9 preview */}
                <div
                  className="relative w-full rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center mb-3"
                  style={{ aspectRatio: "16 / 9" }}
                >
                  {(thumbnailPreview || form.thumbnailUrl) ? (
                    <>
                      <img
                        src={thumbnailPreview || form.thumbnailUrl || ""}
                        alt="Thumbnail preview"
                        className="absolute inset-0 w-full h-full"
                        style={{ objectFit: "cover" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      {thumbnailPreview && (
                        <div className="absolute bottom-3 left-3">
                          <span className="text-[10px] font-mono font-bold text-white bg-amber-500/80 px-2 py-0.5 rounded">
                            PENDING UPLOAD
                          </span>
                        </div>
                      )}
                      {form.thumbnailUrl && !thumbnailPreview && (
                        <div className="absolute bottom-3 left-3">
                          <span className="text-[10px] font-mono text-white/60 bg-black/50 px-2 py-0.5 rounded">
                            16:9 · object-fit: cover
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={thumbnailPreview ? clearThumbnailFile : () => setField("thumbnailUrl", "")}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-red-500/80 transition-colors"
                        title="Remove image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {form.thumbnailUrl && !thumbnailPreview && (
                        <a
                          href={form.thumbnailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-primary/80 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40 select-none pointer-events-none">
                      <ImagePlus className="w-12 h-12" />
                      <span className="text-xs">No image — 16:9 preview</span>
                    </div>
                  )}
                </div>

                {/* Upload button */}
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={thumbnailUploading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {thumbnailUploading
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                      : <><Upload className="w-4 h-4" /> Choose Image</>
                    }
                  </button>
                  {thumbnailFile && (
                    <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-lg bg-muted/30 border border-border">
                      <Image className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="text-xs text-foreground truncate font-mono">{thumbnailFile.name}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        ({(thumbnailFile.size / 1024).toFixed(0)} KB)
                      </span>
                      <button onClick={clearThumbnailFile} className="ml-auto text-muted-foreground hover:text-red-400 flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif"
                    className="hidden"
                    onChange={handleThumbnailPick}
                  />
                </div>

                {thumbnailUploading && (
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading image…
                      </span>
                      <span className="font-mono text-primary">{thumbnailUploadProgress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-200 rounded-full"
                        style={{ width: `${thumbnailUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {thumbnailError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {thumbnailError}
                  </p>
                )}

                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Or paste a URL</p>
                  <input
                    className={inputCls}
                    value={form.thumbnailUrl || ""}
                    onChange={e => { setField("thumbnailUrl", e.target.value); if (e.target.value) clearThumbnailFile(); }}
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              {/* ── Status + Language + Links ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="Status">
                  <CustomSelect
                    value={form.status}
                    onChange={v => setField("status", v as ProjectStatus)}
                    options={STATUS_OPTIONS}
                  />
                </Field>
                <Field label="Code Language">
                  <CustomSelect
                    value={form.language}
                    onChange={v => setField("language", v)}
                    options={LANG_OPTIONS}
                  />
                </Field>
                <Field label="GitHub URL">
                  <input className={inputCls} value={form.githubUrl} onChange={e => setField("githubUrl", e.target.value)} placeholder="https://github.com/..." />
                </Field>
                <Field label="Live / Demo URL">
                  <input className={inputCls} value={form.liveUrl ?? ""} onChange={e => setField("liveUrl", e.target.value)} placeholder="https://..." />
                </Field>
              </div>

              {/* ── Tags ── */}
              <Field label="Tags" sub="Press Enter or comma to add a tag">
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border border-border rounded-lg min-h-[48px] focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
                  {form.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs font-mono bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded">
                      {tag}
                      <button onClick={() => setField("tags", form.tags.filter(t => t !== tag))}>
                        <X className="w-3 h-3 hover:text-red-400 transition-colors" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={handleTag}
                    placeholder={form.tags.length === 0 ? "Add tag…" : ""}
                    className="bg-transparent border-none outline-none text-xs text-foreground placeholder:text-muted-foreground/50 flex-1 min-w-24"
                  />
                </div>
              </Field>

              {/* ── Overview ── */}
              <BilingualField
                label="Overview"
                enValue={form.overview}
                arValue={form.overviewAr}
                onEnChange={v => setField("overview", v)}
                onArChange={v => setField("overviewAr", v)}
                multiline rows={5}
                enPlaceholder="Detailed project overview…"
                arPlaceholder="نظرة عامة مفصلة…"
              />

              {/* ── Custom Sections ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Custom Sections
                    </label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Define your own bilingual content blocks — e.g. "Technical Details", "Process", "Results"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSection}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Section
                  </button>
                </div>

                {form.customSections.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed border-border text-muted-foreground/50 cursor-pointer hover:border-primary/30 hover:text-muted-foreground transition-all"
                    onClick={addSection}
                  >
                    <Layers className="w-8 h-8" />
                    <div className="text-center">
                      <p className="text-sm font-medium">No custom sections yet</p>
                      <p className="text-xs mt-0.5">Click to add a section with a custom title and bilingual content</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {form.customSections.map(section => (
                        <SectionCard
                          key={section.id}
                          section={section}
                          onUpdate={updated => updateSection(section.id, updated)}
                          onRemove={() => removeSection(section.id)}
                        />
                      ))}
                    </AnimatePresence>
                    <button
                      type="button"
                      onClick={addSection}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border text-muted-foreground/60 hover:border-primary/30 hover:text-primary text-xs font-medium transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add another section
                    </button>
                  </div>
                )}
              </div>

              {/* ── Engineering Files ── */}
              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
                  <Box className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Engineering Files</span>
                  <span className="text-xs text-muted-foreground ml-1">Uploaded to Cloudinary as raw files — 50 MB max each</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/50">

                  {/* 3D Model (.glb / .step) */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">3D Model</p>
                      <p className="text-[11px] text-muted-foreground/60">Accepts .glb (web viewer) or .step / .stp (CAD)</p>
                    </div>

                    {form.model3dUrl ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <Box className="w-4 h-4 text-primary flex-shrink-0" />
                        <a
                          href={form.model3dUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary truncate flex-1 hover:underline font-mono"
                          title={form.model3dUrl}
                        >
                          {form.model3dUrl.split("/").pop()?.split("?")[0] ?? "3D model"}
                        </a>
                        <button
                          type="button"
                          onClick={() => { setField("model3dUrl", ""); setModel3dFile(null); if (model3dInputRef.current) model3dInputRef.current.value = ""; }}
                          className="text-muted-foreground hover:text-red-400 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-border text-muted-foreground/40 text-xs">
                        <Box className="w-4 h-4" />
                        No 3D model yet
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => model3dInputRef.current?.click()}
                        disabled={model3dUploading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-60"
                      >
                        {model3dUploading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                          : <><Upload className="w-3.5 h-3.5" /> Choose File</>
                        }
                      </button>
                      {model3dFile && (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-muted/30 border border-border">
                          <FileCode className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-[11px] text-foreground truncate font-mono">{model3dFile.name}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            ({(model3dFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                          <button onClick={() => { setModel3dFile(null); if (model3dInputRef.current) model3dInputRef.current.value = ""; }} className="ml-auto text-muted-foreground hover:text-red-400 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <input
                        ref={model3dInputRef}
                        type="file"
                        accept=".glb,.step,.stp,model/gltf-binary,model/step,application/octet-stream"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const ext = f.name.toLowerCase().split(".").pop() ?? "";
                          console.log(`[3D Pick] name="${f.name}" ext=".${ext}" mime="${f.type}" size=${(f.size/1024/1024).toFixed(2)}MB`);
                          setModel3dFile(f);
                          setModel3dError(null);
                          setModel3dUploadProgress(0);
                        }}
                      />
                    </div>

                    {model3dUploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</span>
                          <span className="font-mono text-primary">{model3dUploadProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${model3dUploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                    {model3dError && (
                      <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {model3dError}
                      </p>
                    )}

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Or paste URL</p>
                      <input
                        className={inputCls}
                        value={form.model3dUrl || ""}
                        onChange={e => { setField("model3dUrl", e.target.value); if (e.target.value) { setModel3dFile(null); } }}
                        placeholder="https://res.cloudinary.com/…/raw/upload/…"
                      />
                    </div>
                  </div>

                  {/* BOM (.pdf / .xlsx) */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Bill of Materials (BOM)</p>
                      <p className="text-[11px] text-muted-foreground/60">Accepts .pdf or .xlsx (.xls) spreadsheet</p>
                    </div>

                    {form.bomUrl ? (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                        <a
                          href={form.bomUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary truncate flex-1 hover:underline font-mono"
                          title={form.bomUrl}
                        >
                          {form.bomUrl.split("/").pop()?.split("?")[0] ?? "BOM file"}
                        </a>
                        <button
                          type="button"
                          onClick={() => { setField("bomUrl", ""); setBomFile(null); if (bomInputRef.current) bomInputRef.current.value = ""; }}
                          className="text-muted-foreground hover:text-red-400 flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-border text-muted-foreground/40 text-xs">
                        <FileText className="w-4 h-4" />
                        No BOM file yet
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => bomInputRef.current?.click()}
                        disabled={bomUploading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-all disabled:opacity-60"
                      >
                        {bomUploading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                          : <><Upload className="w-3.5 h-3.5" /> Choose File</>
                        }
                      </button>
                      {bomFile && (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-muted/30 border border-border">
                          <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-[11px] text-foreground truncate font-mono">{bomFile.name}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            ({(bomFile.size / (1024 * 1024)).toFixed(1)} MB)
                          </span>
                          <button onClick={() => { setBomFile(null); if (bomInputRef.current) bomInputRef.current.value = ""; }} className="ml-auto text-muted-foreground hover:text-red-400 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <input
                        ref={bomInputRef}
                        type="file"
                        accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const ext = f.name.toLowerCase().split(".").pop() ?? "";
                          console.log(`[BOM Pick] name="${f.name}" ext=".${ext}" mime="${f.type}" size=${(f.size/1024/1024).toFixed(2)}MB`);
                          setBomFile(f);
                          setBomError(null);
                          setBomUploadProgress(0);
                        }}
                      />
                    </div>

                    {bomUploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</span>
                          <span className="font-mono text-primary">{bomUploadProgress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${bomUploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                    {bomError && (
                      <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 shrink-0" /> {bomError}
                      </p>
                    )}

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Or paste URL</p>
                      <input
                        className={inputCls}
                        value={form.bomUrl || ""}
                        onChange={e => { setField("bomUrl", e.target.value); if (e.target.value) { setBomFile(null); } }}
                        placeholder="https://res.cloudinary.com/…/raw/upload/…"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {/* ── FILES TAB ── */}
          {tab === "files" && (
            <motion.div key="files" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Project Files</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Gerbers, schematics, 3D models, and source code</p>
                </div>
                {mode === "edit" && (
                  <button
                    onClick={() => setAddFileOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add File
                  </button>
                )}
              </div>

              {mode === "create" && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Save the project first, then you can add files from the Files tab.</span>
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(FILE_TYPE_LABEL) as FileType[]).map(type => {
                  const Icon = FILE_TYPE_ICON[type];
                  const count = currentProject?.files.filter(f => f.type === type).length || 0;
                  return (
                    <div key={type} className={`p-3 rounded-xl border transition-all ${count > 0 ? "bg-primary/5 border-primary/20" : "bg-muted/10 border-border"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-4 h-4 ${count > 0 ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{count}</span>
                      </div>
                      <p className={`text-xs font-medium ${count > 0 ? "text-foreground" : "text-muted-foreground"}`}>{FILE_TYPE_LABEL[type]}</p>
                    </div>
                  );
                })}
              </div>

              {currentProject && currentProject.files.length > 0 ? (
                <div className="space-y-2">
                  {currentProject.files.map(f => {
                    const Icon = FILE_TYPE_ICON[f.type];
                    return (
                      <div key={f.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-4 group hover:border-primary/20 transition-all">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground capitalize">{f.type}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-xs font-mono text-muted-foreground">{f.size}</span>
                          </div>
                          {f.description && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                        </div>
                        <button
                          onClick={() => projectId && removeFile(projectId, f.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : mode === "edit" ? (
                <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-xl">
                  <Upload className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No files yet. Add your first file.</p>
                </div>
              ) : null}

              {/* Add file dialog */}
              <AnimatePresence>
                {addFileOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 8 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95 }}
                      className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground">Add File</h3>
                        <button onClick={() => setAddFileOpen(false)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <Field label="File Type">
                        <CustomSelect
                          value={fileForm.type}
                          onChange={v => setFileForm(f => ({ ...f, type: v as FileType }))}
                          options={(Object.keys(FILE_TYPE_LABEL) as FileType[]).map(t => ({ value: t, label: FILE_TYPE_LABEL[t] }))}
                        />
                      </Field>

                      <Field label="Upload File">
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {fileForm.name ? (
                            <p className="text-sm font-medium text-primary">{fileForm.name}</p>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                              <p className="text-xs text-muted-foreground/50 mt-1">ZIP, PDF, STEP, IGES up to 100MB</p>
                            </>
                          )}
                        </div>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                      </Field>

                      <Field label="Name (overrides filename)">
                        <input className={inputCls} value={fileForm.name} onChange={e => setFileForm(f => ({ ...f, name: e.target.value }))} placeholder="neural-pcb-gerbers-v1.2.zip" />
                      </Field>

                      <Field label="Description">
                        <input className={inputCls} value={fileForm.description} onChange={e => setFileForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description…" />
                      </Field>

                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setAddFileOpen(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground hover:text-foreground transition-all">Cancel</button>
                        <button onClick={submitFile} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:bg-primary/90 transition-all">Add File</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── MEDIA TAB ── */}
          {tab === "media" && (
            <motion.div key="media" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

              {/* ── Hero Video ── */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Film className="w-4 h-4 text-primary" /> Hero Video
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Full-quality project video shown in the header. Delivered via Cloudinary (f_auto, q_auto).</p>
                  </div>
                </div>

                {/* Video preview — local staged file */}
                {videoLocalUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-muted-foreground">Preview (not uploaded yet)</p>
                    <div className="relative rounded-xl overflow-hidden border border-amber-500/30 bg-black" style={{ aspectRatio: "16/9" }}>
                      <video
                        src={videoLocalUrl}
                        controls
                        playsInline
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-[11px] text-amber-400 font-mono">{videoFile?.name} — {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : ""}</p>
                  </div>
                )}

                {/* Video preview — already uploaded (form.videoUrl) */}
                {form.videoUrl && !videoLocalUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-muted-foreground">Current video (saved)</p>
                    <div className="relative rounded-xl overflow-hidden border border-border bg-black" style={{ aspectRatio: "16/9" }}>
                      <video
                        src={form.videoUrl}
                        controls
                        playsInline
                        poster={form.thumbnailUrl || undefined}
                        className="absolute inset-0 w-full h-full object-contain"
                        preload="metadata"
                      />
                    </div>
                    <p className="text-[11px] text-primary/60 font-mono truncate">{form.videoUrl}</p>
                  </div>
                )}

                {/* Upload progress bar */}
                {videoUploading && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-foreground font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Uploading to Cloudinary…
                      </span>
                      <span className="font-mono font-bold text-primary text-base">{videoUploadProgress}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 rounded-full"
                        style={{ width: `${videoUploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {videoFile ? `${(videoFile.size / (1024 * 1024)).toFixed(1)} MB · ` : ""}
                      Large files may take a few minutes — keep this tab open.
                    </p>
                  </div>
                )}

                {videoError && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {videoError}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska"
                    className="hidden"
                    onChange={handleVideoPick}
                  />
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={videoUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-foreground hover:border-primary/40 transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    {videoFile ? "Change File" : "Choose Video"}
                  </button>

                  {videoFile && !videoUploading && (
                    <button
                      onClick={handleVideoUpload}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
                    >
                      <Upload className="w-4 h-4" /> Upload to Cloudinary
                    </button>
                  )}

                  {(form.videoUrl || videoFile) && !videoUploading && (
                    <button
                      onClick={clearVideo}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-all"
                    >
                      <X className="w-4 h-4" /> Remove Video
                    </button>
                  )}

                  {form.videoUrl && !videoFile && (
                    <a
                      href={form.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-border/80 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" /> Open URL
                    </a>
                  )}
                </div>
              </div>

              {/* ── Media Gallery ── */}
              <div>
                <h2 className="text-base font-semibold text-foreground">Media Gallery</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Images and video embeds for the project gallery</p>
              </div>

              {mode === "create" && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Save the project first, then you can add media from this tab.</span>
                </div>
              )}

              {mode === "edit" && (
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Add Media</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setAddMediaType("image")}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${addMediaType === "image" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}
                    >
                      <Image className="w-4 h-4" /> Image URL
                    </button>
                    <button
                      onClick={() => setAddMediaType("video")}
                      className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all ${addMediaType === "video" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80"}`}
                    >
                      <Film className="w-4 h-4" /> Video Embed
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className={`${inputCls} flex-1`}
                      value={addMediaUrl}
                      onChange={e => setAddMediaUrl(e.target.value)}
                      placeholder={addMediaType === "image" ? "https://... (image URL)" : "https://youtube.com/embed/..."}
                    />
                    <button onClick={submitMedia} className="bg-primary text-primary-foreground px-4 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">Add</button>
                  </div>
                  <input
                    className={inputCls}
                    value={addMediaCaption}
                    onChange={e => setAddMediaCaption(e.target.value)}
                    placeholder="Caption (optional)"
                  />
                </div>
              )}

              {currentProject && currentProject.media.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentProject.media.map(m => (
                    <div key={m.id} className="group relative rounded-xl overflow-hidden border border-border bg-card"
                      style={{ aspectRatio: "16/9" }}
                    >
                      {m.type === "image" ? (
                        <img src={m.url} alt={m.caption} className="w-full h-full" style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Film className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                        <button
                          onClick={() => projectId && removeMedia(projectId, m.id)}
                          className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {m.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 px-3 py-2">
                          <p className="text-xs text-white/80 truncate">{m.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : mode === "edit" ? (
                <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-xl">
                  <Image className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No media yet. Add images or videos above.</p>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* ── UPDATES TAB ── */}
          {tab === "updates" && (
            <motion.div key="updates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Progress Updates</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Version log and milestone entries shown on the public project page</p>
                </div>
                {mode === "edit" && (
                  <button
                    onClick={() => setAddUpdateOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Update
                  </button>
                )}
              </div>

              {mode === "create" && (
                <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-muted-foreground">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Save the project first, then add updates from this tab.</span>
                </div>
              )}

              {currentProject && currentProject.updates.length > 0 ? (
                <div className="space-y-3 relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                  {[...currentProject.updates].reverse().map(u => (
                    <div key={u.id} className="flex gap-3 items-start group">
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1.5 border-2 border-background ${
                        u.type === "release" ? "bg-chart-2" :
                        u.type === "feature" ? "bg-primary" :
                        u.type === "fix" ? "bg-chart-3" :
                        u.type === "design" ? "bg-chart-5" : "bg-muted-foreground"
                      }`} />
                      <div className="flex-1 bg-card border border-border rounded-xl p-4 min-w-0 hover:border-primary/20 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-foreground">{u.title}</span>
                              {u.version && <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{u.version}</span>}
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded border capitalize ${UPDATE_TYPE_COLOR[u.type]}`}>{u.type}</span>
                              {u.adminOnly && <span className="text-xs flex items-center gap-1 text-muted-foreground"><Lock className="w-3 h-3" />Admin</span>}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{u.date}</p>
                          </div>
                          <button
                            onClick={() => projectId && removeUpdate(projectId, u.id)}
                            className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {u.desc && <p className="text-xs text-muted-foreground mt-2">{u.desc}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : mode === "edit" ? (
                <div className="text-center py-14 text-muted-foreground border border-dashed border-border rounded-xl">
                  <Calendar className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No updates yet. Add the first milestone.</p>
                </div>
              ) : null}

              {/* Add update dialog */}
              <AnimatePresence>
                {addUpdateOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 8 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95 }}
                      className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-foreground">Add Update</h3>
                        <button onClick={() => setAddUpdateOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Date">
                          <input type="date" className={inputCls} value={updateForm.date} onChange={e => setUpdateForm(f => ({ ...f, date: e.target.value }))} />
                        </Field>
                        <Field label="Version">
                          <input className={inputCls} value={updateForm.version} onChange={e => setUpdateForm(f => ({ ...f, version: e.target.value }))} placeholder="v1.0.0" />
                        </Field>
                      </div>

                      <Field label="Type">
                        <div className="flex flex-wrap gap-2">
                          {UPDATE_TYPES.map(t => (
                            <button
                              key={t}
                              onClick={() => setUpdateForm(f => ({ ...f, type: t }))}
                              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border capitalize transition-all ${updateForm.type === t ? UPDATE_TYPE_COLOR[t] : "border-border text-muted-foreground hover:border-border/80"}`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </Field>

                      <div className="space-y-4">
                        <BilingualField
                          label="Title"
                          enValue={updateForm.title}
                          arValue={updateForm.titleAr}
                          onEnChange={v => setUpdateForm(f => ({ ...f, title: v }))}
                          onArChange={v => setUpdateForm(f => ({ ...f, titleAr: v }))}
                          enPlaceholder="Power Optimization"
                          arPlaceholder="تحسين الطاقة"
                        />
                        <BilingualField
                          label="Description"
                          enValue={updateForm.desc}
                          arValue={updateForm.descAr}
                          onEnChange={v => setUpdateForm(f => ({ ...f, desc: v }))}
                          onArChange={v => setUpdateForm(f => ({ ...f, descAr: v }))}
                          multiline rows={2}
                          enPlaceholder="What changed?"
                          arPlaceholder="ماذا تغير؟"
                        />
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          onClick={() => setUpdateForm(f => ({ ...f, adminOnly: !f.adminOnly }))}
                          className={`w-9 h-5 rounded-full transition-colors ${updateForm.adminOnly ? "bg-primary" : "bg-muted"} relative`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${updateForm.adminOnly ? "left-4" : "left-0.5"}`} />
                        </div>
                        <span className="text-sm text-foreground">Admin-only (hidden from public)</span>
                      </label>

                      <div className="flex gap-3">
                        <button onClick={() => setAddUpdateOpen(false)} className="flex-1 border border-border rounded-lg py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        <button onClick={submitUpdate} className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:bg-primary/90">Add Update</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === "history" && currentProject && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Version History</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{currentProject.commits.length} commits · Git-style change log</p>
              </div>

              <div className="font-mono text-xs space-y-0 bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                  <GitCommit className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-semibold">main</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{currentProject.commits.length} commits</span>
                </div>
                {[...currentProject.commits].reverse().map((c, i) => (
                  <div
                    key={c.hash}
                    className={`flex items-start gap-4 px-4 py-3 group hover:bg-muted/10 transition-colors ${i < currentProject.commits.length - 1 ? "border-b border-border/40" : ""}`}
                  >
                    <span className={`shrink-0 mt-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${COMMIT_TYPE_COLOR[c.type] ?? "bg-muted text-muted-foreground"}`}>
                      {c.type.toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-foreground/90 group-hover:text-foreground transition-colors break-all">{c.message}</span>
                      {c.fields.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {c.fields.map(f => (
                            <span key={f} className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded border border-border/50">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-muted-foreground">
                      <span className="text-primary/80">{c.hash}</span>
                      <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {currentProject.commits.length === 0 && (
                  <div className="px-4 py-8 text-center text-muted-foreground/50">
                    <p>No commits yet. Save the project to create the first commit.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
