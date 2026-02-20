/**
 * Maintenance Types
 *
 * JSDoc type definitions for maintenance feature (equipment/cleaning + certificates)
 */

/**
 * Task type: equipment/cleaning (recurring) or certificate (expiry/renewal)
 * @typedef {'equipment' | 'certificate'} MaintenanceTaskType
 */

/**
 * Equipment/Cleaning task (recurring)
 * @typedef {Object} EquipmentTask
 * @property {string} id - Unique ID
 * @property {'equipment'} taskType - Task type
 * @property {string} itemName - Item name
 * @property {string} [lastDoneDate] - Last done date (YYYY-MM-DD)
 * @property {number} [frequencyDays] - Frequency in days (every X days)
 * @property {string} [nextDueDate] - Next due date (YYYY-MM-DD), alternative to frequency
 * @property {string} [notes] - Optional notes
 * @property {string} createdAt - Creation timestamp
 * @property {string} [updatedAt] - Last update timestamp
 */

/**
 * Equipment task "done" history entry
 * @typedef {Object} EquipmentHistoryEntry
 * @property {string} id - Unique ID
 * @property {string} taskId - Parent task ID
 * @property {string} doneDate - Date done (YYYY-MM-DD)
 * @property {string} [notes] - Notes
 * @property {string} doneBy - User ID who marked done
 * @property {string} createdAt - Timestamp
 */

/**
 * Certificate/Document task (expiry tracking)
 * @typedef {Object} CertificateTask
 * @property {string} id - Unique ID
 * @property {'certificate'} taskType - Task type
 * @property {string} documentName - Document name
 * @property {string} [documentType] - Document type (optional)
 * @property {string} [issuedDate] - Issued date (YYYY-MM-DD)
 * @property {string} expiryDate - Expiry date (YYYY-MM-DD)
 * @property {number} reminderDaysBefore - Reminder days before expiry (e.g. 30)
 * @property {string} [notes] - Optional notes
 * @property {string} [attachmentUrl] - Attachment URL (ImageKit or similar)
 * @property {string} [attachmentFileId] - Attachment file ID
 * @property {string} createdAt - Creation timestamp
 * @property {string} [updatedAt] - Last update timestamp
 */

/**
 * Certificate renewal history entry
 * @typedef {Object} CertificateRenewalEntry
 * @property {string} id - Unique ID
 * @property {string} taskId - Parent certificate task ID
 * @property {string} renewedDate - Date renewed
 * @property {string} newExpiryDate - New expiry date
 * @property {string} [attachmentUrl] - New attachment URL
 * @property {string} [attachmentFileId] - New attachment file ID
 * @property {string} [notes] - Notes
 * @property {string} renewedBy - User ID who renewed
 * @property {string} createdAt - Timestamp
 */
