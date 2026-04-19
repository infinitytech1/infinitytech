import { useState, useEffect, useCallback } from "react";
import type { AdminProject, Commit, CustomSection, ProjectUpdate, ProjectFile, ProjectMedia } from "./types";

const PIN_KEY = "it-admin-pin";
const DEFAULT_PIN = "admin2024";

function getPin(): string {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function genHash() {
  return Math.random().toString(16).slice(2, 9);
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── DB row ↔ AdminProject mappers ─────────────────────────────────────────────

function dbToAdmin(row: Record<string, any>): AdminProject {
  const commits: Commit[] = row.commits && Array.isArray(row.commits)
    ? row.commits
    : [{
        hash: (row.id as string).slice(0, 7),
        message: "Loaded from database",
        timestamp: row.created_at,
        type: "create",
        fields: [],
      }];

  const rawSections = row.custom_sections;
  const customSections: CustomSection[] = Array.isArray(rawSections)
    ? rawSections
    : [];

  return {
    id: row.id,
    title: row.title_en ?? "",
    titleAr: row.title_ar ?? "",
    description: row.description_en ?? "",
    descriptionAr: row.description_ar ?? "",
    overview: row.overview_en ?? "",
    overviewAr: row.overview_ar ?? "",
    tags: row.tags ?? [],
    status: row.status ?? "active",
    language: row.language ?? "c",
    githubUrl: row.github_url ?? "",
    liveUrl: row.live_link ?? "",
    category: row.category ?? "",
    thumbnailUrl: row.thumbnail_url ?? "",
    videoUrl: row.video_url ?? "",
    model3dUrl: row.model_3d_url ?? "",
    bomUrl: row.bom_url ?? "",
    customSections,
    timeline: row.timeline ?? [],
    files: row.files ?? [],
    media: row.media ?? [],
    updates: row.updates ?? [],
    commits,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    views: row.views ?? 0,
    downloads: row.downloads ?? 0,
  };
}

export function adminToDb(p: Omit<AdminProject, "id" | "createdAt" | "updatedAt" | "commits" | "views" | "downloads">) {
  return {
    title_en: p.title,
    title_ar: p.titleAr,
    description_en: p.description,
    description_ar: p.descriptionAr,
    overview_en: p.overview,
    overview_ar: p.overviewAr,
    tags: p.tags,
    status: p.status,
    language: p.language,
    github_url: p.githubUrl,
    live_link: p.liveUrl,
    category: p.category,
    thumbnail_url: p.thumbnailUrl || null,
    video_url: p.videoUrl || null,
    model_3d_url: p.model3dUrl || null,
    bom_url: p.bomUrl || null,
    custom_sections: p.customSections,
    timeline: p.timeline,
    files: p.files,
    media: p.media,
    updates: p.updates,
  };
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      "x-admin-pin": getPin(),
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = (json as any)?.error ?? `HTTP ${res.status}`;
    throw new Error(message);
  }

  return json as T;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStore() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all projects on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<{ projects: Record<string, any>[] }>("/api/projects")
      .then(({ projects: rows }) => {
        if (!cancelled) {
          setProjects(rows.map(dbToAdmin));
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error("[store] Failed to load projects:", err);
          setError(err.message ?? "Failed to load projects");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const getProject = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  // ── Create ─────────────────────────────────────────────────────────────────

  const createProject = useCallback(async (
    data: Omit<AdminProject, "id" | "createdAt" | "updatedAt" | "commits" | "views" | "downloads">
  ): Promise<AdminProject> => {
    setSaving(true);
    setError(null);
    try {
      const { project: row } = await apiFetch<{ project: Record<string, any> }>(
        "/api/projects",
        { method: "POST", body: JSON.stringify(adminToDb(data)) }
      );
      const created = dbToAdmin(row);
      setProjects(prev => [created, ...prev]);
      return created;
    } catch (err: any) {
      const msg = err.message ?? "Failed to create project";
      setError(msg);
      console.error("[store] createProject error:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Update ─────────────────────────────────────────────────────────────────

  const updateProject = useCallback(async (
    id: string,
    data: Partial<AdminProject>,
    commitMessage?: string
  ): Promise<AdminProject | null> => {
    setSaving(true);
    setError(null);

    // Build DB payload from only the writable fields in data
    const writable = adminToDb(data as any);
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(writable)) {
      if (k in writable && v !== undefined) payload[k] = v;
    }

    try {
      const { project: row } = await apiFetch<{ project: Record<string, any> }>(
        `/api/projects/${id}`,
        { method: "PATCH", body: JSON.stringify(payload) }
      );

      const updated = dbToAdmin(row);

      // Append a commit entry for the UI history tab
      const commit: Commit = {
        hash: genHash(),
        message: commitMessage || `Updated ${Object.keys(data).join(", ")}`,
        timestamp: updated.updatedAt,
        type: Object.keys(data).includes("status") ? "release" : "update",
        fields: Object.keys(data),
      };
      const withCommit: AdminProject = {
        ...updated,
        commits: [...(getProject(id)?.commits ?? []), commit],
      };

      setProjects(prev => prev.map(p => (p.id === id ? withCommit : p)));
      return withCommit;
    } catch (err: any) {
      const msg = err.message ?? "Failed to update project";
      setError(msg);
      console.error("[store] updateProject error:", err);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [getProject]);

  // ── Delete ─────────────────────────────────────────────────────────────────

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    setSaving(true);
    setError(null);
    // Optimistic removal
    setProjects(prev => prev.filter(p => p.id !== id));
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
    } catch (err: any) {
      const msg = err.message ?? "Failed to delete project";
      setError(msg);
      console.error("[store] deleteProject error:", err);
      // Rollback — reload from server
      apiFetch<{ projects: Record<string, any>[] }>("/api/projects")
        .then(({ projects: rows }) => setProjects(rows.map(dbToAdmin)))
        .catch(() => {});
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Sub-item helpers (patch full arrays back to DB) ────────────────────────

  const addUpdate = useCallback(async (projectId: string, update: Omit<ProjectUpdate, "id">) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return;
    const newUpdate: ProjectUpdate = { ...update, id: genId() };
    await updateProject(projectId, { updates: [...p.updates, newUpdate] }, `Add update: ${update.title}`);
  }, [projects, updateProject]);

  const removeUpdate = useCallback(async (projectId: string, updateId: string) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return;
    await updateProject(projectId, { updates: p.updates.filter(u => u.id !== updateId) });
  }, [projects, updateProject]);

  const addFile = useCallback(async (projectId: string, file: Omit<ProjectFile, "id" | "uploadedAt">) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return;
    const newFile: ProjectFile = { ...file, id: genId(), uploadedAt: new Date().toISOString() };
    await updateProject(projectId, { files: [...p.files, newFile] }, `Upload file: ${file.name}`);
  }, [projects, updateProject]);

  const removeFile = useCallback(async (projectId: string, fileId: string) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return;
    await updateProject(projectId, { files: p.files.filter(f => f.id !== fileId) });
  }, [projects, updateProject]);

  const addMedia = useCallback(async (projectId: string, media: Omit<ProjectMedia, "id" | "uploadedAt">) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return;
    const newMedia: ProjectMedia = { ...media, id: genId(), uploadedAt: new Date().toISOString() };
    await updateProject(projectId, { media: [...p.media, newMedia] }, `Add media: ${media.type}`);
  }, [projects, updateProject]);

  const removeMedia = useCallback(async (projectId: string, mediaId: string) => {
    const p = projects.find(x => x.id === projectId);
    if (!p) return;
    await updateProject(projectId, { media: p.media.filter(m => m.id !== mediaId) });
  }, [projects, updateProject]);

  const resetToDefaults = useCallback(() => {
    // Re-fetch from DB (no local defaults — DB is the source of truth)
    setLoading(true);
    apiFetch<{ projects: Record<string, any>[] }>("/api/projects")
      .then(({ projects: rows }) => { setProjects(rows.map(dbToAdmin)); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  return {
    projects,
    loading,
    saving,
    error,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    addUpdate,
    removeUpdate,
    addFile,
    removeFile,
    addMedia,
    removeMedia,
    resetToDefaults,
  };
}
