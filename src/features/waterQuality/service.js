/**
 * Water Quality Service
 * 
 * Business logic for water quality monitoring
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEYS = {
  ENTRIES: 'water_quality_entries',
  RANGES: 'water_quality_ranges',
};

// Default ranges (can be overridden in settings)
const DEFAULT_RANGES = {
  pHMin: 6.5,
  pHMax: 8.5,
  tdsMax: 300,
  chlorineMin: 0.2,
  chlorineMax: 2.0,
  warningTolerance: 10, // 10% tolerance for warnings
};

/**
 * Generate unique ID for water quality entry
 * @returns {string} Unique ID
 */
export function generateWaterQualityId() {
  return `wq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all water quality entries from storage
 * @returns {Promise<import('./types.js').WaterQualityEntry[]>}
 */
export async function loadWaterQualityEntries() {
  const entries = await storageService.getItem(STORAGE_KEYS.ENTRIES);
  return entries || [];
}

/**
 * Save all water quality entries to storage
 * @param {import('./types.js').WaterQualityEntry[]} entries - Array of entries
 * @returns {Promise<void>}
 */
export async function saveWaterQualityEntries(entries) {
  await storageService.setItem(STORAGE_KEYS.ENTRIES, entries);
}

/**
 * Load water quality ranges from storage
 * @returns {Promise<import('./types.js').WaterQualityRanges>}
 */
export async function loadWaterQualityRanges() {
  const ranges = await storageService.getItem(STORAGE_KEYS.RANGES);
  return ranges || { ...DEFAULT_RANGES };
}

/**
 * Save water quality ranges to storage
 * @param {import('./types.js').WaterQualityRanges} ranges - Ranges to save
 * @returns {Promise<void>}
 */
export async function saveWaterQualityRanges(ranges) {
  await storageService.setItem(STORAGE_KEYS.RANGES, ranges);
}

/**
 * Check if entry exists for a given date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {import('./types.js').WaterQualityEntry[]} existingEntries - Existing entries
 * @returns {boolean} True if entry exists
 */
export function entryExistsForDate(date, existingEntries) {
  return existingEntries.some((entry) => entry.date === date);
}

/**
 * Calculate percentage deviation from range
 * @param {number} value - Value to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Percentage deviation (0 if within range, positive if outside)
 */
function calculateDeviation(value, min, max) {
  if (value >= min && value <= max) {
    return 0;
  }
  
  if (value < min) {
    return ((min - value) / min) * 100;
  }
  
  return ((value - max) / max) * 100;
}

/**
 * Check if value is within warning range (slightly out of range)
 * @param {number} value - Value to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} tolerance - Warning tolerance percentage
 * @returns {boolean} True if in warning range
 */
function isWarningRange(value, min, max, tolerance) {
  const deviation = calculateDeviation(value, min, max);
  return deviation > 0 && deviation <= tolerance;
}

/**
 * Check if value is in critical range (far outside range)
 * @param {number} value - Value to check
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} tolerance - Warning tolerance percentage
 * @returns {boolean} True if in critical range
 */
function isCriticalRange(value, min, max, tolerance) {
  const deviation = calculateDeviation(value, min, max);
  return deviation > tolerance;
}

/**
 * Validate water quality entry
 * @param {import('./types.js').WaterQualityFormData} data - Entry data
 * @param {import('./types.js').WaterQualityEntry[]} existingEntries - Existing entries
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export function validateWaterQualityEntry(data, existingEntries) {
  if (!data.date) {
    return { isValid: false, error: 'Date is required' };
  }

  if (data.pH === undefined || data.pH === null || data.pH < 0 || data.pH > 14) {
    return { isValid: false, error: 'pH must be between 0 and 14' };
  }

  if (data.tds === undefined || data.tds === null || data.tds < 0) {
    return { isValid: false, error: 'TDS must be a positive number' };
  }

  if (data.chlorine === undefined || data.chlorine === null || data.chlorine < 0) {
    return { isValid: false, error: 'Chlorine must be a positive number' };
  }

  // Check if entry already exists for this date
  if (entryExistsForDate(data.date, existingEntries)) {
    return { isValid: false, error: 'An entry already exists for this date' };
  }

  return { isValid: true };
}

/**
 * Analyze water quality values against ranges
 * @param {import('./types.js').WaterQualityFormData} data - Entry data
 * @param {import('./types.js').WaterQualityRanges} ranges - Quality ranges
 * @returns {{status: string, alerts: string[]}} Analysis result
 */
export function analyzeWaterQuality(data, ranges) {
  const alerts = [];
  let status = 'normal';
  const tolerance = ranges.warningTolerance || 10;

  // Check pH
  if (data.pH < ranges.pHMin || data.pH > ranges.pHMax) {
    if (isCriticalRange(data.pH, ranges.pHMin, ranges.pHMax, tolerance)) {
      alerts.push(`CRITICAL: pH level ${data.pH} is far outside safe range (${ranges.pHMin}-${ranges.pHMax})`);
      status = 'critical';
    } else if (isWarningRange(data.pH, ranges.pHMin, ranges.pHMax, tolerance)) {
      alerts.push(`WARNING: pH level ${data.pH} is slightly outside safe range (${ranges.pHMin}-${ranges.pHMax})`);
      if (status !== 'critical') {
        status = 'warning';
      }
    }
  }

  // Check TDS
  if (data.tds > ranges.tdsMax) {
    const deviation = ((data.tds - ranges.tdsMax) / ranges.tdsMax) * 100;
    if (deviation > tolerance) {
      alerts.push(`CRITICAL: TDS level ${data.tds} ppm is far above safe limit (${ranges.tdsMax} ppm)`);
      status = 'critical';
    } else {
      alerts.push(`WARNING: TDS level ${data.tds} ppm is slightly above safe limit (${ranges.tdsMax} ppm)`);
      if (status !== 'critical') {
        status = 'warning';
      }
    }
  }

  // Check Chlorine
  if (data.chlorine < ranges.chlorineMin || data.chlorine > ranges.chlorineMax) {
    if (isCriticalRange(data.chlorine, ranges.chlorineMin, ranges.chlorineMax, tolerance)) {
      alerts.push(`CRITICAL: Chlorine level ${data.chlorine} is far outside safe range (${ranges.chlorineMin}-${ranges.chlorineMax})`);
      status = 'critical';
    } else if (isWarningRange(data.chlorine, ranges.chlorineMin, ranges.chlorineMax, tolerance)) {
      alerts.push(`WARNING: Chlorine level ${data.chlorine} is slightly outside safe range (${ranges.chlorineMin}-${ranges.chlorineMax})`);
      if (status !== 'critical') {
        status = 'warning';
      }
    }
  }

  return { status, alerts };
}

/**
 * Create a new water quality entry
 * @param {import('./types.js').WaterQualityFormData} data - Entry data
 * @param {import('./types.js').WaterQualityEntry[]} existingEntries - Existing entries
 * @param {import('./types.js').WaterQualityRanges} ranges - Quality ranges
 * @param {string} [createdBy] - User who created the entry
 * @returns {Promise<import('./types.js').WaterQualityEntry>} Created entry
 */
export async function createWaterQualityEntry(data, existingEntries, ranges, createdBy) {
  // Validate entry
  const validation = validateWaterQualityEntry(data, existingEntries);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Analyze quality
  const analysis = analyzeWaterQuality(data, ranges);

  // Create entry
  const now = new Date().toISOString();
  const newEntry = {
    id: generateWaterQualityId(),
    date: data.date,
    time: data.time || new Date().toTimeString().slice(0, 5), // Default to current time if not provided
    pH: data.pH,
    tds: data.tds,
    chlorine: data.chlorine,
    status: analysis.status,
    alerts: analysis.alerts,
    createdAt: now,
    createdBy: createdBy || null,
  };

  // Save to storage
  const updatedEntries = [...existingEntries, newEntry];
  await saveWaterQualityEntries(updatedEntries);

  return newEntry;
}

/**
 * Get entry for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {import('./types.js').WaterQualityEntry[]} entries - All entries
 * @returns {import('./types.js').WaterQualityEntry | null} Entry or null
 */
export function getEntryForDate(date, entries) {
  return entries.find((entry) => entry.date === date) || null;
}

/**
 * Get latest entry
 * @param {import('./types.js').WaterQualityEntry[]} entries - All entries
 * @returns {import('./types.js').WaterQualityEntry | null} Latest entry or null
 */
export function getLatestEntry(entries) {
  if (entries.length === 0) return null;
  return entries.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
}

/**
 * Get entries with alerts (warnings or critical)
 * @param {import('./types.js').WaterQualityEntry[]} entries - All entries
 * @returns {import('./types.js').WaterQualityEntry[]} Entries with alerts
 */
export function getEntriesWithAlerts(entries) {
  return entries.filter((entry) => entry.status === 'warning' || entry.status === 'critical');
}

/**
 * Get critical entries
 * @param {import('./types.js').WaterQualityEntry[]} entries - All entries
 * @returns {import('./types.js').WaterQualityEntry[]} Critical entries
 */
export function getCriticalEntries(entries) {
  return entries.filter((entry) => entry.status === 'critical');
}
