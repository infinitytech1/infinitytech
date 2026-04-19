import { pool } from "./index";

/**
 * Idempotent database initialisation — creates all required tables if they
 * do not exist yet.  Safe to call on every server startup.
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    // ── projects ──────────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id              TEXT        PRIMARY KEY,
        title_en        TEXT        NOT NULL DEFAULT '',
        title_ar        TEXT        NOT NULL DEFAULT '',
        description_en  TEXT        NOT NULL DEFAULT '',
        description_ar  TEXT        NOT NULL DEFAULT '',
        overview_en     TEXT,
        overview_ar     TEXT,
        problem_en      TEXT,
        problem_ar      TEXT,
        solution_en     TEXT,
        solution_ar     TEXT,
        thumbnail_url   TEXT,
        video_url       TEXT,
        assets_zip_url  TEXT,
        model_3d_url    TEXT,
        bom_url         TEXT,
        tags            TEXT[]      NOT NULL DEFAULT '{}',
        status          TEXT        NOT NULL DEFAULT 'active',
        github_url      TEXT,
        live_link       TEXT,
        category        TEXT,
        language        TEXT,
        code_snippet    TEXT,
        custom_sections JSONB,
        timeline        JSONB,
        files           JSONB,
        media           JSONB,
        updates         JSONB,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects (status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at);
    `);

    // ── project_stats ─────────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_stats (
        id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        project_id      TEXT        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        views_count     INTEGER     NOT NULL DEFAULT 0,
        downloads_count INTEGER     NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_project_stats_project_id ON project_stats (project_id);
    `);

    // ── analytics_events ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        project_id  TEXT        REFERENCES projects(id) ON DELETE SET NULL,
        event_type  TEXT        NOT NULL,
        session_id  TEXT,
        metadata    JSONB,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── push_subscriptions ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        endpoint    TEXT        NOT NULL UNIQUE,
        keys        JSONB       NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // ── Engineering file columns — added in v2; safe to run on existing DBs ──
    // ALTER TABLE ... ADD COLUMN IF NOT EXISTS is idempotent — no-op if column exists.
    await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS model_3d_url TEXT;`);
    await client.query(`ALTER TABLE projects ADD COLUMN IF NOT EXISTS bom_url TEXT;`);
    console.log("[DB] ✓ Engineering columns verified (model_3d_url, bom_url)");

    console.log("[DB] ✓ All tables verified / initialised");
  } catch (err) {
    console.error("[DB] ✗ Failed to initialise tables:", err);
    throw err;
  } finally {
    client.release();
  }
}
