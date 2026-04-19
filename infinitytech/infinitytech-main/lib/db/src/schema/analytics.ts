import { pgTable, bigserial, varchar, integer, boolean, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analyticsEvents = pgTable("analytics_events", {
  id:          bigserial("id", { mode: "number" }).primaryKey(),
  eventType:   varchar("event_type", { length: 32 }).notNull(),
  projectId:   varchar("project_id", { length: 128 }),
  path:        varchar("path", { length: 512 }),
  lang:        varchar("lang", { length: 8 }).default("en"),
  referrer:    varchar("referrer", { length: 512 }),
  sessionId:   varchar("session_id", { length: 64 }),
  durationMs:  integer("duration_ms"),
  createdAt:   timestamp("created_at", { withTimezone: true }).defaultNow(),
}, t => [
  index("idx_ae_project_id").on(t.projectId),
  index("idx_ae_event_type").on(t.eventType),
  index("idx_ae_created_at").on(t.createdAt),
]);

export const projectStats = pgTable("project_stats", {
  projectId:      varchar("project_id", { length: 128 }).primaryKey(),
  viewsCount:     integer("views_count").default(0),
  downloadsCount: integer("downloads_count").default(0),
  avgTimeMs:      integer("avg_time_ms").default(0),
  updatedAt:      timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, createdAt: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type ProjectStats = typeof projectStats.$inferSelect;
