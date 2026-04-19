import { useQuery } from "@tanstack/react-query";
import type { Project } from "@/data/projects";

const API_BASE = import.meta.env.VITE_API_URL || "";

type DbRow = {
  id: string;
  title_en: string;
  title_ar: string | null;
  description_en: string;
  description_ar: string | null;
  overview_en: string | null;
  overview_ar: string | null;
  problem_en: string | null;
  problem_ar: string | null;
  solution_en: string | null;
  solution_ar: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  assets_zip_url: string | null;
  tags: string[] | null;
  status: string;
  github_url: string | null;
  live_link: string | null;
  category: string | null;
  language: string | null;
  code_snippet: string | null;
  timeline: Project["timeline"] | null;
  files: Project["files"] | null;
  media: Project["media"] | null;
  updates: Project["updates"] | null;
  created_at: string;
  updated_at: string;
};

function dbToProject(row: DbRow): Project {
  return {
    id: row.id,
    title: row.title_en,
    titleAr: row.title_ar ?? "",
    description: row.description_en,
    descriptionAr: row.description_ar ?? "",
    tags: row.tags ?? [],
    overview: row.overview_en ?? "",
    overviewAr: row.overview_ar ?? "",
    problem: row.problem_en ?? "",
    problemAr: row.problem_ar ?? "",
    solution: row.solution_en ?? "",
    solutionAr: row.solution_ar ?? "",
    codeSnippet: row.code_snippet ?? "",
    language: row.language ?? "c",
    timeline: row.timeline ?? [],
    githubUrl: row.github_url ?? "",
    liveUrl: row.live_link ?? undefined,
    category: row.category ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    status: row.status as Project["status"],
    files: row.files ?? [],
    media: buildMedia(row),
    updates: row.updates ?? [],
  };
}

function buildMedia(row: DbRow): Project["media"] {
  const items: Project["media"] = [];

  if (row.video_url) {
    items.push({
      id: "hero-video",
      type: "video",
      url: row.video_url,
      caption: "Project demo video",
      captionAr: "فيديو المشروع",
      thumbnail: row.thumbnail_url ?? undefined,
    });
  }

  if (row.thumbnail_url && !row.video_url) {
    items.push({
      id: "hero-thumb",
      type: "image",
      url: row.thumbnail_url,
      caption: "Project thumbnail",
      captionAr: "صورة المشروع",
    });
  }

  const extra = (row.media as Project["media"]) ?? [];
  return [...items, ...extra];
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/api/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  const json = await res.json();
  return (json.projects as DbRow[]).map(dbToProject);
}

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects/${id}`);
  if (!res.ok) throw new Error("Project not found");
  const json = await res.json();
  return dbToProject(json.project as DbRow);
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 60_000,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export interface ContactFormPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function submitContactForm(data: ContactFormPayload) {
  const res = await fetch(`${API_BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to send message");
  }
  return { success: true };
}
