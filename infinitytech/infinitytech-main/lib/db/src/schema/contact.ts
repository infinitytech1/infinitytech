import { pgTable, bigserial, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactMessages = pgTable("contact_messages", {
  id:         bigserial("id", { mode: "number" }).primaryKey(),
  name:       varchar("name", { length: 100 }).notNull(),
  email:      varchar("email", { length: 200 }),
  phone:      varchar("phone", { length: 30 }),
  subject:    varchar("subject", { length: 200 }).notNull(),
  message:    text("message").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactMessages).omit({ id: true, created_at: true });
export type InsertContact = z.infer<typeof insertContactSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
