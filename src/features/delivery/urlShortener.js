/**
 * URL shortening for WhatsApp message links (e.g. delivery proof image URLs).
 * Uses TinyURL public API (no API key). Falls back to original URL on failure.
 */

const TINYURL_API = 'https://tinyurl.com/api-create.php';

/**
 * Shorten a long URL for use in WhatsApp messages (reduces message length and avoids URL limits).
 * @param {string} longUrl - Full URL to shorten (e.g. ImageKit delivery proof URL)
 * @returns {Promise<string>} Short URL, or the original URL if shortening fails
 */
export async function shortenUrl(longUrl) {
  if (!longUrl || typeof longUrl !== 'string') return longUrl || '';
  const trimmed = longUrl.trim();
  if (!trimmed) return '';

  try {
    const res = await fetch(`${TINYURL_API}?url=${encodeURIComponent(trimmed)}`, {
      method: 'GET',
      mode: 'cors',
    });
    if (!res.ok) return trimmed;
    const short = (await res.text()).trim();
    if (short && short.startsWith('http')) return short;
    return trimmed;
  } catch {
    return trimmed;
  }
}
