import { getPool, ensureSchema } from './_db.js';

// Simple token auth — set ADMIN_TOKEN in Vercel env vars
function isAuthed(req) {
  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export default async function handler(req, res) {
  await ensureSchema();
  const db = getPool();

  // ── GET /api/posts — public, returns published posts only ──
  if (req.method === 'GET') {
    const { status, limit = 50, offset = 0 } = req.query;

    // Admin can request drafts too (with auth)
    const showAll = status === 'all' && isAuthed(req);
    const whereClause = showAll ? '' : "WHERE status = 'published'";

    const { rows } = await db.query(`
      SELECT id, slug, title, excerpt, category, emoji, cover_image,
             seo_title, seo_desc, seo_keywords, status, published_at, updated_at
      FROM posts
      ${whereClause}
      ORDER BY published_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    return res.status(200).json({ posts: rows });
  }

  // ── POST /api/posts — admin only, create post ──
  if (req.method === 'POST') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

    const {
      id, slug, title, excerpt, body, category, emoji,
      cover_image, seo_title, seo_desc, seo_keywords,
      status, published_at
    } = req.body;

    if (!id || !slug || !title) {
      return res.status(400).json({ error: 'id, slug, and title are required' });
    }

    const { rows } = await db.query(`
      INSERT INTO posts
        (id, slug, title, excerpt, body, category, emoji, cover_image,
         seo_title, seo_desc, seo_keywords, status, published_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [id, slug, title, excerpt, body, category, emoji, cover_image,
        seo_title, seo_desc, seo_keywords, status, published_at || new Date()]);

    return res.status(201).json({ post: rows[0] });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
