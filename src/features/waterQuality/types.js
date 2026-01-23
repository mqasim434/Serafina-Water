/**
 * Water Quality Types
 * 
 * JSDoc type definitions for water quality feature
 */

/**
 * Water quality entry
 * @typedef {Object} WaterQualityEntry
 * @property {string} id - Unique entry identifier
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} pH - pH level
 * @property {number} tds - TDS level (ppm)
 * @property {number} chlorine - Chlorine level
 * @property {string} status - Status ('normal', 'warning', 'critical')
 * @property {string[]} alerts - Array of alert messages
 * @property {string} createdAt - Creation timestamp (ISO string)
 * @property {string} [createdBy] - User who created the entry
 */

/**
 * Water quality form data
 * @typedef {Object} WaterQualityFormData
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {number} pH - pH level
 * @property {number} tds - TDS level (ppm)
 * @property {number} chlorine - Chlorine level
 */

/**
 * Water quality ranges (configurable in settings)
 * @typedef {Object} WaterQualityRanges
 * @property {number} pHMin - Minimum pH value
 * @property {number} pHMax - Maximum pH value
 * @property {number} tdsMax - Maximum TDS value (ppm)
 * @property {number} chlorineMin - Minimum chlorine value
 * @property {number} chlorineMax - Maximum chlorine value
 * @property {number} [warningTolerance] - Percentage tolerance for warnings (default: 10%)
 */

/**
 * Water quality state
 * @typedef {Object} WaterQualityState
 * @property {WaterQualityEntry[]} items - Array of water quality entries
 * @property {WaterQualityRanges} ranges - Allowed ranges for water quality
 * @property {boolean} isLoading - Loading state
 * @property {string | null} error - Error message if any
 */
