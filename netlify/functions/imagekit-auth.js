/**
 * ImageKit auth for client-side upload.
 * Returns { token, signature, expire } for ImageKit upload API.
 *
 * Set in Netlify: Site settings → Environment variables → IMAGEKIT_PRIVATE_KEY
 */

const crypto = require('crypto');

function uuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { Allow: 'GET', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
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
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'ImageKit not configured' }),
    };
  }

  const q = event.queryStringParameters || {};
  const token = q.token || uuidV4();
  const expire = Number(q.expire) || Math.floor(Date.now() / 1000) + 3600;
  const message = token + expire;
  const signature = crypto.createHmac('sha1', privateKey).update(message).digest('hex');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ token, signature, expire }),
  };
};
