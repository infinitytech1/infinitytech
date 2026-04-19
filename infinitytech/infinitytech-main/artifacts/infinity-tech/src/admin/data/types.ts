export type ProjectStatus = "active" | "completed" | "archived";

export interface CustomSection {
  id: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
}
export type FileType = "gerbers" | "schematic" | "model3d" | "source";
export type MediaType = "image" | "video";
export type UpdateType = "release" | "feature" | "fix" | "design" | "test" | "note";
export type CommitType = "create" | "update" | "release" | "fix" | "design";

export interface ProjectFile {
  id: string;
  name: string;
  type: FileType;
  description: string;
  size: string;
  url?: string;
  uploadedAt: string;
}

export interface ProjectMedia {
  id: string;
  type: MediaType;
  url: string;
  caption: string;
  captionAr: string;
  uploadedAt: string;
}

export interface ProjectUpdate {
  id: string;
  date: string;
  version: string;
  title: string;
  titleAr: string;
  desc: string;
  descAr: string;
  type: UpdateType;
  adminOnly: boolean;
}

export interface Commit {
  hash: string;
  message: string;
  timestamp: string;
  type: CommitType;
  fields: string[];
}

export interface AdminProject {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  overview: string;
  overviewAr: string;
  tags: string[];
  status: ProjectStatus;
  language: string;
  githubUrl: string;
  liveUrl?: string;
  category?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  model3dUrl?: string;
  bomUrl?: string;
  customSections: CustomSection[];
  timeline: { date: string; title: string; desc: string }[];
  files: ProjectFile[];
  media: ProjectMedia[];
  updates: ProjectUpdate[];
  commits: Commit[];
  createdAt: string;
  updatedAt: string;
  views: number;
  downloads: number;
}
