/**
 * Storage Service Abstraction
 * 
 * Provides a unified interface for persistence.
 * Uses Firebase Firestore if available, falls back to localStorage
 */

import { getDocuments, setDocument, deleteDocument, batchSetDocuments } from './firestore.js';
import { db } from './firebase.js';

/**
 * @typedef {Object} StorageService
 * @property {function(string, any): Promise<void>} setItem - Store an item
 * @property {function(string): Promise<any>} getItem - Retrieve an item
 * @property {function(string): Promise<void>} removeItem - Remove an item
 * @property {function(): Promise<void>} clear - Clear all items
 */

/**
 * Firebase Firestore-based storage implementation with localStorage fallback
 */
class FirebaseStorageService {
  /**
   * Check if Firestore is available
   * @returns {boolean}
   */
  _isFirestoreAvailable() {
    return !!db;
  }

  /**
   * Store an item in Firestore or localStorage
   * @param {string} key - Storage key (collection name for Firestore)
   * @param {any} value - Value to store (array of items or single value/object)
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    try {
      if (this._isFirestoreAvailable()) {
        if (Array.isArray(value)) {
          // Firestore: Store as collection documents
          // Each item in the array becomes a document with its id as docId
          const items = value.map(item => ({
            id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data: item,
          }));
          await batchSetDocuments(key, items);
        } else {
          // Firestore: Store single value/object as a single document with fixed ID
          const { setDocument } = await import('./firestore.js');
          await setDocument(key, 'data', { value }, true); // merge = true
        }
      } else {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Storage setItem error for key "${key}":`, error);
      // Fallback to localStorage on error
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (fallbackError) {
        console.error(`LocalStorage fallback error for key "${key}":`, fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Retrieve an item from Firestore or localStorage
   * @param {string} key - Storage key (collection name for Firestore)
   * @returns {Promise<any>} Parsed value or null if not found
   */
  async getItem(key) {
    try {
      if (this._isFirestoreAvailable()) {
        // Firestore: Try to get as collection first (array)
        const documents = await getDocuments(key);
        if (documents.length > 0) {
          // Check if it's a single document with 'value' property (single value/object)
          if (documents.length === 1 && documents[0].id === 'data' && documents[0].value !== undefined) {
            return documents[0].value;
          }
          // Otherwise return array of documents
          return documents;
        }
        
        // Try to get as single document (for single values/objects)
        const { getDocument } = await import('./firestore.js');
        const singleDoc = await getDocument(key, 'data');
        if (singleDoc && singleDoc.value !== undefined) {
          return singleDoc.value;
        }
        
        return null;
      } else {
        // Fallback to localStorage
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.error(`Storage getItem error for key "${key}":`, error);
      // Fallback to localStorage on error
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (fallbackError) {
        console.error(`LocalStorage fallback error for key "${key}":`, fallbackError);
        return null;
      }
    }
  }

  /**
   * Remove an item from Firestore or localStorage
   * @param {string} key - Storage key (collection name for Firestore - not used, kept for compatibility)
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    try {
      // For Firestore, we don't delete collections, only documents
      // This method is kept for compatibility but doesn't delete the collection
      // Individual documents should be deleted via deleteDocument
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Storage removeItem error for key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Clear all items from localStorage (Firestore collections are not cleared)
   * @returns {Promise<void>}
   */
  async clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new FirebaseStorageService();

// Export class for testing
export { FirebaseStorageService };
