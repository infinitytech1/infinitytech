import { pgTable, bigserial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const pushSubscriptions = pgTable("push_subscriptions", {
  id:         bigserial("id", { mode: "number" }).primaryKey(),
  endpoint:   text("endpoint").notNull().unique(),
  p256dh:     text("p256dh").notNull(),
  auth:       text("auth").notNull(),
  user_agent: varchar("user_agent", { length: 512 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
