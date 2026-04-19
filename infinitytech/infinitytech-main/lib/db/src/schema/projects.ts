import { pgTable, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projects = pgTable("projects", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title_en:       text("title_en").notNull(),
  title_ar:       text("title_ar").notNull().default(""),
  description_en: text("description_en").notNull().default(""),
  description_ar: text("description_ar").notNull().default(""),
  overview_en:    text("overview_en"),
  overview_ar:    text("overview_ar"),
  problem_en:     text("problem_en"),
  problem_ar:     text("problem_ar"),
  solution_en:    text("solution_en"),
  solution_ar:    text("solution_ar"),
  thumbnail_url:  text("thumbnail_url"),
  video_url:      text("video_url"),
  assets_zip_url: text("assets_zip_url"),
  model_3d_url:   text("model_3d_url"),
  bom_url:        text("bom_url"),
  tags:           text("tags").array().notNull().default(sql`'{}'::text[]`),
  status:         text("status").notNull().default("active"),
  github_url:     text("github_url"),
  live_link:      text("live_link"),
  category:       text("category"),
  language:       text("language"),
  code_snippet:   text("code_snippet"),
  custom_sections: jsonb("custom_sections"),
  timeline:        jsonb("timeline"),
  files:           jsonb("files"),
  media:           jsonb("media"),
  updates:         jsonb("updates"),
  created_at:     timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at:     timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, t => [
  index("idx_projects_status").on(t.status),
  index("idx_projects_created_at").on(t.created_at),
]);

export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, created_at: true, updated_at: true });
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
