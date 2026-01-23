/**
 * LocalStorage Service
 * 
 * Client-side only storage for session data (tokens, user preferences, etc.)
 * This is separate from storageService which uses Firestore for application data.
 */

/**
 * LocalStorage service for client-side session data
 */
class LocalStorageService {
  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  _isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Store an item in localStorage
   * @param {string} key - Storage key
   * @param {any} value - Value to store (will be JSON stringified)
   * @returns {void}
   */
  setItem(key, value) {
    if (!this._isAvailable()) {
      console.warn('localStorage is not available');
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving to localStorage for key "${key}":`, error);
    }
  }

  /**
   * Retrieve an item from localStorage
   * @param {string} key - Storage key
   * @returns {any | null} Parsed value or null if not found
   */
  getItem(key) {
    if (!this._isAvailable()) {
      return null;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove an item from localStorage
   * @param {string} key - Storage key
   * @returns {void}
   */
  removeItem(key) {
    if (!this._isAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
    }
  }

  /**
   * Clear all items from localStorage
   * @returns {void}
   */
  clear() {
    if (!this._isAvailable()) {
      return;
    }

    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

// Export class for testing
export { LocalStorageService };
