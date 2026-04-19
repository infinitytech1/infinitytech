import { pgTable, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const skills = pgTable("skills", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name_en:    text("name_en").notNull(),
  name_ar:    text("name_ar").notNull().default(""),
  category:   text("category").notNull().default("General"),
  level:      text("level"),
  sort_order: integer("sort_order").notNull().default(0),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, t => [
  index("idx_skills_category").on(t.category),
  index("idx_skills_sort").on(t.sort_order),
]);

export const insertSkillSchema = createInsertSchema(skills).omit({
  id: true, created_at: true, updated_at: true,
});
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
