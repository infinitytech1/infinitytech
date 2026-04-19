export interface DbProject {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  overview_en: string | null;
  overview_ar: string | null;
  problem_en: string | null;
  problem_ar: string | null;
  solution_en: string | null;
  solution_ar: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  assets_zip_url: string | null;
  tags: string[];
  status: "active" | "completed" | "archived";
  github_url: string | null;
  language: string | null;
  code_snippet: string | null;
  timeline: { date: string; title: string; desc: string }[] | null;
  files: {
    id: string;
    name: string;
    type: string;
    description: string;
    size: string;
    url?: string;
  }[] | null;
  media: {
    id: string;
    type: "image" | "video";
    url: string;
    caption?: string;
    captionAr?: string;
    thumbnail?: string;
  }[] | null;
  updates: {
    id: string;
    date: string;
    version: string;
    title: string;
    titleAr: string;
    desc: string;
    descAr: string;
    type: string;
    adminOnly?: boolean;
  }[] | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: DbProject;
        Insert: Omit<DbProject, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DbProject, "id" | "created_at" | "updated_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
