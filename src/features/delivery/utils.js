/**
 * Delivery utilities
 */

/**
 * Get display value for deliveredBy field.
 * - Human-entered name: shown as-is
 * - User ID (legacy): resolved to user display name if user found, otherwise null (don't show raw ID)
 * @param {string} [deliveredBy] - Value from order.deliveredBy
 * @param {{ id: string, displayName?: string, username?: string }[]} [users] - Users for ID resolution
 * @returns {string|null} Display name or null if should not be shown
 */
export function getDeliveredByDisplay(deliveredBy, users = []) {
  if (!deliveredBy) return null;
  if (deliveredBy.startsWith('user_')) {
    const user = users?.find((u) => u.id === deliveredBy);
    if (!user) return null; // Don't show raw user ID
    return user.displayName || user.username || null;
  }
  return deliveredBy; // Human-entered name
}
