/**
 * Storage Service Abstraction
 * 
 * Provides a unified interface for persistence using Firebase Firestore only.
 * No localStorage fallback - Firebase is required.
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
 * Firebase Firestore-based storage implementation (Firebase only, no localStorage)
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
   * Store an item in Firestore
   * @param {string} key - Storage key (collection name for Firestore)
   * @param {any} value - Value to store (array of items or single value/object)
   * @returns {Promise<void>}
   * @throws {Error} If Firestore is not available
   */
  async setItem(key, value) {
    if (!this._isFirestoreAvailable()) {
      throw new Error('Firestore is not initialized. Please configure Firebase environment variables.');
    }

    try {
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
        await setDocument(key, 'data', { value }, true); // merge = true
      }
    } catch (error) {
      console.error(`Storage setItem error for key "${key}":`, error);
      throw new Error(`Failed to save data to Firestore: ${error.message}`);
    }
  }

  /**
   * Retrieve an item from Firestore
   * @param {string} key - Storage key (collection name for Firestore)
   * @returns {Promise<any>} Parsed value or empty array/null if not found
   * @throws {Error} If Firestore is not available
   */
  async getItem(key) {
    if (!this._isFirestoreAvailable()) {
      throw new Error('Firestore is not initialized. Please configure Firebase environment variables.');
    }

    try {
      // Firestore: Try to get as collection first (array)
      const documents = await getDocuments(key);
      if (documents.length > 0) {
        // Check if it's a single document with 'value' property (single value/object)
        if (documents.length === 1 && documents[0].id === 'data' && documents[0].value !== undefined) {
          return documents[0].value;
        }
        // Return array of documents (each document already has id and product fields)
        // Documents from Firestore have structure: { id: docId, ...productData }
        return documents;
      }
      
      // Try to get as single document (for single values/objects)
      const singleDoc = await getDocument(key, 'data');
      if (singleDoc && singleDoc.value !== undefined) {
        return singleDoc.value;
      }
      
      // Return empty array if collection exists but is empty (for array-based collections)
      return [];
    } catch (error) {
      console.error(`Storage getItem error for key "${key}":`, error);
      // Return empty array instead of throwing to allow app to continue
      return [];
    }
  }

  /**
   * Remove an item from Firestore
   * Note: For Firestore, collections are not deleted via this method
   * Individual documents should be deleted via deleteDocument from firestore.js
   * @param {string} key - Storage key (collection name for Firestore)
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    // For Firestore, we don't delete collections via this method
    // Individual documents should be deleted via deleteDocument from firestore.js
    // This method is kept for compatibility but doesn't affect Firestore
    console.warn(`removeItem called for "${key}" - Firestore collections are not deleted via this method. Use deleteDocument from firestore.js instead.`);
  }

  /**
   * Clear all items (Firestore collections are not cleared)
   * Note: This method doesn't affect Firestore data
   * @returns {Promise<void>}
   */
  async clear() {
    // Firestore collections are not cleared by this method
    // This is kept for compatibility but doesn't affect Firestore
    console.warn('clear() called - Firestore collections are not cleared by this method.');
  }
}

// Export singleton instance
export const storageService = new FirebaseStorageService();

// Export class for testing
export { FirebaseStorageService };
