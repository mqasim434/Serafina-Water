/**
 * Water Quality Service
 *
 * Business logic for water quality monitoring
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';
import { localStorageService } from '../../shared/services/localStorage.js';
import { getTranslation, translations } from '../i18n/translations.js';
import { normalizeLanguage, DEFAULT_LANGUAGE } from '../i18n/service.js';

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
 * Format time from HH:MM (24-hour) to 12-hour AM/PM
 * @param {string} time - Time in HH:MM or HH:MM:SS format
 * @returns {string} Time in 12-hour format (e.g. "2:30 PM") or original if invalid
 */
export function formatTime12h(time) {
  if (!time || typeof time !== 'string') return time || '';
  const match = time.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return time;
  const [, h, m] = match;
  const hour = parseInt(h, 10);
  const min = parseInt(m, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${String(min).padStart(2, '0')} ${period}`;
}

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

  if (data.pH === undefined || data.pH === null || typeof data.pH !== 'number' || Number.isNaN(data.pH)) {
    return { isValid: false, error: 'pH must be a number' };
  }

  if (data.tds === undefined || data.tds === null || typeof data.tds !== 'number' || Number.isNaN(data.tds)) {
    return { isValid: false, error: 'TDS must be a number' };
  }

  if (data.chlorine === undefined || data.chlorine === null || typeof data.chlorine !== 'number' || Number.isNaN(data.chlorine)) {
    return { isValid: false, error: 'Chlorine must be a number' };
  }

  // Removed: One entry per day restriction - now allows multiple entries per day

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

  // Determine current language for alerts based on persisted i18n state.
  /** @type {import('../i18n/types.js').Language} */
  let lang = DEFAULT_LANGUAGE;
  try {
    const saved = localStorageService.getItem('i18n_language');
    if (typeof saved === 'string' && translations[saved]) {
      lang = /** @type {import('../i18n/types.js').Language} */ (normalizeLanguage(saved));
    }
  } catch {
    // ignore and keep default 'en'
  }

  const tRaw = (key) => getTranslation(key, lang, translations);
  const format = (templateKey, vars) => {
    let str = tRaw(templateKey);
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, String(v));
    });
    return str;
  };

  // Check pH
  if (data.pH < ranges.pHMin || data.pH > ranges.pHMax) {
    if (isCriticalRange(data.pH, ranges.pHMin, ranges.pHMax, tolerance)) {
      alerts.push(
        format('criticalPhAlertTemplate', {
          value: data.pH,
          min: ranges.pHMin,
          max: ranges.pHMax,
        })
      );
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
      alerts.push(
        format('criticalTdsAlertTemplate', {
          value: data.tds,
          max: ranges.tdsMax,
        })
      );
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
      alerts.push(
        format('criticalChlorineAlertTemplate', {
          value: data.chlorine,
          min: ranges.chlorineMin,
          max: ranges.chlorineMax,
        })
      );
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
  // Sort by date, then time, then createdAt (ms precision) so most recent is first
  const sorted = [...entries].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    const timeDiff = (b.time || '').localeCompare(a.time || '', undefined, { numeric: true });
    if (timeDiff !== 0) return timeDiff;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
  return sorted[0];
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
