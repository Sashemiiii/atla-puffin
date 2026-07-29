import { getPool, ensureSchema } from './_db.js';

export default async function handler(req, res) {
  await ensureSchema();
  const db = getPool();

  const { rows } = await db.query(`
    SELECT slug, updated_at FROM posts
    WHERE status = 'published'
    ORDER BY published_at DESC
  `);

  const staticPages = [
    { url: 'https://atlapuffin.com/', priority: '1.0' },
    { url: 'https://atlapuffin.com/shop.html', priority: '0.9' },
    { url: 'https://atlapuffin.com/about.html', priority: '0.8' },
    { url: 'https://atlapuffin.com/blog', priority: '0.8' },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>${p.url}</loc>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${rows.map(p => `  <url>
    <loc>https://atlapuffin.com/blog/${p.slug}</loc>
    <lastmod>${new Date(p.updated_at).toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(xml);
}
