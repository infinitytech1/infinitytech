import { pgTable, bigserial, bigint, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const comments = pgTable("comments", {
  id:        bigserial("id", { mode: "number" }).primaryKey(),
  projectId: varchar("project_id", { length: 128 }).notNull(),
  parentId:  bigint("parent_id", { mode: "number" }),
  name:      varchar("name", { length: 128 }).notNull(),
  message:   text("message").notNull(),
  isHidden:  boolean("is_hidden").default(false),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, t => [
  index("idx_comments_project").on(t.projectId, t.isDeleted, t.isHidden),
]);

export const insertCommentSchema = createInsertSchema(comments)
  .omit({ id: true, isHidden: true, isDeleted: true, createdAt: true })
  .extend({
    name: z.string().min(1).max(128),
    message: z.string().min(1).max(2000),
    projectId: z.string().min(1).max(128),
    parentId: z.number().optional(),
  });

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
