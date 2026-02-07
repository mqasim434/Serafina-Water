/**
 * ImageKit auth endpoint for client-side upload.
 * Returns { token, signature, expire } for ImageKit upload API.
 *
 * Set in Vercel (or .env for vercel dev):
 *   IMAGEKIT_PRIVATE_KEY - Your ImageKit private API key (never use VITE_ prefix here)
 */

const crypto = require('crypto');

function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let privateKey = process.env.IMAGEKIT_PRIVATE_KEY || '';
  if (privateKey) {
    privateKey = privateKey.trim();
    try {
      privateKey = decodeURIComponent(privateKey);
    } catch (_) {}
  }
  if (!privateKey) {
    console.error('IMAGEKIT_PRIVATE_KEY is not set');
    return res.status(500).json({ error: 'ImageKit not configured' });
  }

  const token = req.query.token || uuidV4();
  const expire = Number(req.query.expire) || Math.floor(Date.now() / 1000) + 1800; // 30 min (ImageKit requires < 1 hour)
  const message = token + expire;
  const signature = crypto.createHmac('sha1', privateKey).update(message).digest('hex');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ token, signature, expire });
};
