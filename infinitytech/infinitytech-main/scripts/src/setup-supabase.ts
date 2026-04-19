/**
 * One-time setup: create the `projects` table in Supabase.
 * Run: pnpm --filter @workspace/scripts run setup-supabase
 *
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Verify connection
const { error: pingErr } = await supabase.from("projects").select("id").limit(1);

if (!pingErr || pingErr.code !== "PGRST205") {
  if (!pingErr) {
    console.log("✅ Table 'projects' already exists.");
    process.exit(0);
  }
  console.error("Unexpected error:", pingErr);
  process.exit(1);
}

console.log("Table 'projects' not found — creating via SQL Editor instructions.");
console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("Run this SQL in your Supabase SQL Editor:");
console.log("https://supabase.com/dashboard/project/kbqhoyipoxmyhtbuhlkd/sql");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
console.log(await import("fs").then(fs => fs.readFileSync("supabase_schema.sql", "utf8")));
