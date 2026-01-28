/**
 * Firestore Service
 * 
 * Wrapper around Firestore operations for easier use
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * Convert Firestore non-serializable values (e.g. Timestamp) into
 * serializable primitives for Redux state / actions.
 *
 * - Timestamp -> ISO string
 * - Arrays/Objects -> deep-normalized
 */
function normalizeFirestoreValue(value) {
  if (value === null || value === undefined) return value;

  // Firestore Timestamp-like (has toDate())
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      return d instanceof Date ? d.toISOString() : value;
    } catch {
      return value;
    }
  }

  if (Array.isArray(value)) {
    return value.map(normalizeFirestoreValue);
  }

  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = normalizeFirestoreValue(v);
    }
    return out;
  }

  return value;
}

/**
 * Get a document from a collection
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<any | null>} Document data or null
 */
export async function getDocument(collectionName, docId) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...normalizeFirestoreValue(docSnap.data()) };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection
 * @param {string} collectionName - Collection name
 * @param {Array<{field: string, operator: string, value: any}>} [filters] - Optional filters
 * @param {string} [orderByField] - Field to order by
 * @param {'asc' | 'desc'} [orderDirection] - Order direction
 * @returns {Promise<Array<any>>} Array of documents with IDs
 */
export async function getDocuments(collectionName, filters = [], orderByField = null, orderDirection = 'asc') {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const colRef = collection(db, collectionName);
    let q = query(colRef);
    
    // Apply filters
    if (filters && Array.isArray(filters) && filters.length > 0) {
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }
    
    // Apply ordering
    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection));
    }
    
    const querySnapshot = await getDocs(q);
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...normalizeFirestoreValue(doc.data()),
    }));
    
    console.log(`Retrieved ${documents.length} documents from collection "${collectionName}"`);
    return documents;
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    // Don't throw - return empty array instead to allow fallback
    console.warn(`Falling back to empty array for collection "${collectionName}"`);
    return [];
  }
}

/**
 * Create or update a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID (if null, will auto-generate)
 * @param {any} data - Document data
 * @param {boolean} [merge=false] - Whether to merge with existing data
 * @returns {Promise<string>} Document ID
 */
export async function setDocument(collectionName, docId, data, merge = false) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    // Add timestamps
    const dataWithTimestamps = {
      ...data,
      updatedAt: serverTimestamp(),
      ...(docId ? {} : { createdAt: serverTimestamp() }),
    };
    
    if (docId) {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, dataWithTimestamps, { merge });
      return docId;
    } else {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, dataWithTimestamps);
      return docRef.id;
    }
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {any} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document ${docId} in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document ${docId} from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Batch operations helper
 * @param {string} collectionName - Collection name
 * @param {Array<{id: string, data: any}>} items - Items to batch write
 * @returns {Promise<void>}
 */
export async function batchSetDocuments(collectionName, items) {
  try {
    if (!db) {
      throw new Error('Firestore not initialized');
    }
    
    const batch = writeBatch(db);
    
    items.forEach(item => {
      const docRef = doc(db, collectionName, item.id);
      const dataToSet = {
        ...item.data,
        updatedAt: serverTimestamp(),
      };
      // Only add createdAt if it doesn't exist in the data
      if (!item.data.createdAt) {
        dataToSet.createdAt = serverTimestamp();
      } else {
        dataToSet.createdAt = item.data.createdAt;
      }
      batch.set(docRef, dataToSet);
    });
    
    await batch.commit();
  } catch (error) {
    console.error(`Error batch setting documents in ${collectionName}:`, error);
    throw error;
  }
}
