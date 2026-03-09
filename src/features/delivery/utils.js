/**
 * Delivery utilities
 */

/**
 * Get display value for deliveredBy field.
 * - If it matches a user ID, show that user's display name/username
 * - Otherwise, treat it as a human-entered name and show as-is
 * @param {string} [deliveredBy] - Value from order.deliveredBy
 * @param {{ id: string, displayName?: string, username?: string }[]} [users] - Users for ID resolution
 * @returns {string|null} Display name or null if should not be shown
 */
export function getDeliveredByDisplay(deliveredBy, users = []) {
  if (!deliveredBy) return null;
  const user = users?.find((u) => u.id === deliveredBy);
  if (user) {
    return user.displayName || user.username || deliveredBy;
  }
  // Fallback: treat as already a human-entered name
  return deliveredBy;
}
