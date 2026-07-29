import { getPool, ensureSchema } from '../_db.js';

function isAuthed(req) {
  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${process.env.ADMIN_TOKEN}`;
}

export default async function handler(req, res) {
  await ensureSchema();
  const db = getPool();
  const { id } = req.query;

  // ── GET /api/posts/[id] — fetch single post by id or slug ──
  if (req.method === 'GET') {
    const { rows } = await db.query(
      `SELECT * FROM posts WHERE id = $1 OR slug = $1 LIMIT 1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const post = rows[0];
    // Don't expose drafts publicly
    if (post.status !== 'published' && !isAuthed(req)) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({ post });
  }

  // ── PUT /api/posts/[id] — update post ──
  if (req.method === 'PUT') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

    const {
      slug, title, excerpt, body, category, emoji,
      cover_image, seo_title, seo_desc, seo_keywords,
      status, published_at
    } = req.body;

    const { rows } = await db.query(`
      UPDATE posts SET
        slug=$1, title=$2, excerpt=$3, body=$4, category=$5, emoji=$6,
        cover_image=$7, seo_title=$8, seo_desc=$9, seo_keywords=$10,
        status=$11, published_at=$12, updated_at=NOW()
      WHERE id=$13
      RETURNING *
    `, [slug, title, excerpt, body, category, emoji,
        cover_image, seo_title, seo_desc, seo_keywords,
        status, published_at, id]);

    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ post: rows[0] });
  }

  // ── DELETE /api/posts/[id] ──
  if (req.method === 'DELETE') {
    if (!isAuthed(req)) return res.status(401).json({ error: 'Unauthorized' });

    await db.query(`DELETE FROM posts WHERE id = $1`, [id]);
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
