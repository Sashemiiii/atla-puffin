// POST /api/auth
// Exchanges the admin password for a bearer token
// Set ADMIN_PASSWORD and ADMIN_TOKEN in Vercel environment variables

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    return res.status(200).json({ token: process.env.ADMIN_TOKEN });
  }

  return res.status(401).json({ error: 'Invalid password' });
}
