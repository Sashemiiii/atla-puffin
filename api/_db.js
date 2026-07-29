// Shared PostgreSQL client for all API routes
// Uses pg (node-postgres) — already available on Vercel Node runtime
import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Railway requires SSL
    });
  }
  return pool;
}

// Run once on cold start — creates table if it doesn't exist
export async function ensureSchema() {
  const db = getPool();
  await db.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id          TEXT PRIMARY KEY,
      slug        TEXT UNIQUE NOT NULL,
      title       TEXT NOT NULL,
      excerpt     TEXT,
      body        TEXT,
      category    TEXT DEFAULT 'Blog',
      emoji       TEXT DEFAULT '🏓',
      cover_image TEXT,
      seo_title   TEXT,
      seo_desc    TEXT,
      seo_keywords TEXT,
      status      TEXT DEFAULT 'draft',
      published_at TIMESTAMPTZ,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS posts_slug_idx ON posts(slug);
    CREATE INDEX IF NOT EXISTS posts_status_idx ON posts(status);
    CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(published_at DESC);
  `);
}
