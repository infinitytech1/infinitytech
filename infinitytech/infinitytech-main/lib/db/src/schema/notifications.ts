import { pgTable, bigserial, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

export const notifications = pgTable("notifications", {
  id:        bigserial("id", { mode: "number" }).primaryKey(),
  type:      varchar("type", { length: 32 }).notNull(),
  projectId: varchar("project_id", { length: 128 }),
  title:     varchar("title", { length: 256 }).notNull(),
  body:      text("body"),
  isRead:    boolean("is_read").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, t => [
  index("idx_notif_is_read").on(t.isRead, t.createdAt),
]);

export type Notification = typeof notifications.$inferSelect;
