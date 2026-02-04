/**
 * ImageKit upload for delivery proof photos.
 *
 * Env (matches ImageKit sample: publicKey, urlEndpoint, authenticationEndpoint):
 *   VITE_IMAGEKIT_PUBLIC_KEY - ImageKit public key (Dashboard)
 *   VITE_IMAGEKIT_URL_ENDPOINT - ImageKit URL endpoint e.g. https://ik.imagekit.io/your_id (for image URLs)
 *   VITE_IMAGEKIT_AUTH_ENDPOINT - YOUR backend that returns { token, signature, expire }. NOT ik.imagekit.io
 *
 * Photos are stored in ImageKit. Order records store deliveryProofFileId.
 */

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

function decodeKey(value) {
  if (!value || typeof value !== 'string') return value || '';
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return value.trim();
  }
}

const PUBLIC_KEY = decodeKey(import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '');
const URL_ENDPOINT = (import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '').trim();
const AUTH_ENDPOINT_RAW = (import.meta.env.VITE_IMAGEKIT_AUTH_ENDPOINT || '').trim();

/** Resolve auth URL: use as-is if absolute, else current origin + path (so /api/imagekit-auth works). */
function getAuthEndpoint() {
  const s = (AUTH_ENDPOINT_RAW || '').trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin + (s.startsWith('/') ? s : '/' + s);
  }
  return s;
}

/** ImageKit URL endpoint (for building image URLs / IKImage). */
export function getImageKitUrlEndpoint() {
  return URL_ENDPOINT || '';
}

/**
 * Check if ImageKit upload is configured
 * @returns {boolean}
 */
export function isImageKitConfigured() {
  return !!(PUBLIC_KEY && AUTH_ENDPOINT_RAW);
}

/**
 * Fetch authentication parameters from backend
 * @returns {Promise<{ token: string, signature: string, expire: number }>}
 */
async function getAuthParams() {
  const url = getAuthEndpoint();
  if (!url) throw new Error('ImageKit auth endpoint not set');
  const res = await fetch(url, { method: 'GET', credentials: 'same-origin' });
  if (!res.ok) {
    const body = await res.text();
    let msg = `ImageKit auth failed: ${res.status}`;
    if (res.status === 400 && (body.includes('imagekit') || url.includes('imagekit.io'))) {
      msg += '. Use your backend URL (e.g. /api/imagekit-auth or /.netlify/functions/imagekit-auth), not the ImageKit dashboard URL.';
    } else if (body) {
      try {
        const j = JSON.parse(body);
        if (j.error || j.message) msg += ` — ${j.error || j.message}`;
      } catch {
        if (body.length < 120) msg += ` — ${body}`;
      }
    }
    throw new Error(msg);
  }
  const data = await res.json();
  if (!data.token || !data.signature || data.expire == null) {
    throw new Error('Invalid ImageKit auth response');
  }
  return { token: data.token, signature: data.signature, expire: data.expire };
}

/**
 * Upload a file to ImageKit (for delivery proof).
 * @param {File} file - Image file
 * @param {string} [folder] - Optional folder path (e.g. 'delivery-proof')
 * @returns {Promise<{ url: string, fileId: string }>}
 */
export async function uploadDeliveryProof(file, folder = 'delivery-proof') {
  if (!isImageKitConfigured()) {
    throw new Error('ImageKit is not configured. Set VITE_IMAGEKIT_PUBLIC_KEY and VITE_IMAGEKIT_AUTH_ENDPOINT.');
  }
  const auth = await getAuthParams();
  const fileName = `delivery_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${(file.name || 'jpg').split('.').pop()}`;
  const form = new FormData();
  form.append('file', file);
  form.append('fileName', fileName);
  form.append('publicKey', PUBLIC_KEY);
  form.append('token', auth.token);
  form.append('signature', auth.signature);
  form.append('expire', String(auth.expire));
  form.append('useUniqueFileName', 'true');
  if (folder) form.append('folder', folder);
  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Upload failed: ${res.status}`);
  }
  const result = await res.json();
  return { url: result.url, fileId: result.fileId };
}
