/**
 * ImageKit auth endpoint for client-side upload.
 * Returns { token, signature, expire } for ImageKit upload API.
 *
 * Set in Vercel (or .env for vercel dev):
 *   IMAGEKIT_PRIVATE_KEY - Your ImageKit private API key (never use VITE_ prefix here)
 */

import crypto from 'crypto';

function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'OPTIONS, GET');
    Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
    return res.status(204).end();
  }

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

  try {
    const query = req.query || {};
    const token = query.token || uuidV4();
    const expire = Number(query.expire) || Math.floor(Date.now() / 1000) + 1800; // 30 min (ImageKit requires < 1 hour)
    const message = token + expire;
    const signature = crypto.createHmac('sha1', privateKey).update(message).digest('hex');

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ token, signature, expire });
  } catch (err) {
    console.error('ImageKit auth error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
