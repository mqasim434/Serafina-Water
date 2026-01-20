/**
 * Settings Service
 * 
 * Business logic for application settings
 * No React/Redux dependencies - pure JavaScript functions
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEY = 'app_settings';

// Default settings
const DEFAULT_SETTINGS = {
  bottlePrice: 50,
  depositAmount: 0,
  companyInfo: {
    name: 'Serafina Water',
    address: '',
    phone: '',
    email: '',
    website: '',
  },
  defaultLanguage: 'en',
};

/**
 * Load settings from storage
 * @returns {Promise<import('./types.js').AppSettings>} Application settings
 */
export async function loadSettings() {
  const settings = await storageService.getItem(STORAGE_KEY);
  return settings || { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to storage
 * @param {import('./types.js').AppSettings} settings - Settings to save
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  await storageService.setItem(STORAGE_KEY, settings);
}

/**
 * Update bottle price
 * @param {number} price - New bottle price
 * @param {import('./types.js').AppSettings} currentSettings - Current settings
 * @returns {Promise<import('./types.js').AppSettings>} Updated settings
 */
export async function updateBottlePrice(price, currentSettings) {
  if (price < 0) {
    throw new Error('Bottle price cannot be negative');
  }

  const updated = {
    ...currentSettings,
    bottlePrice: price,
  };
  await saveSettings(updated);
  return updated;
}

/**
 * Update deposit amount
 * @param {number} amount - New deposit amount
 * @param {import('./types.js').AppSettings} currentSettings - Current settings
 * @returns {Promise<import('./types.js').AppSettings>} Updated settings
 */
export async function updateDepositAmount(amount, currentSettings) {
  if (amount < 0) {
    throw new Error('Deposit amount cannot be negative');
  }

  const updated = {
    ...currentSettings,
    depositAmount: amount,
  };
  await saveSettings(updated);
  return updated;
}

/**
 * Update company info
 * @param {import('./types.js').CompanyInfo} companyInfo - Company information
 * @param {import('./types.js').AppSettings} currentSettings - Current settings
 * @returns {Promise<import('./types.js').AppSettings>} Updated settings
 */
export async function updateCompanyInfo(companyInfo, currentSettings) {
  const updated = {
    ...currentSettings,
    companyInfo: {
      ...currentSettings.companyInfo,
      ...companyInfo,
    },
  };
  await saveSettings(updated);
  return updated;
}

/**
 * Update default language
 * @param {string} language - Language code (en/ur)
 * @param {import('./types.js').AppSettings} currentSettings - Current settings
 * @returns {Promise<import('./types.js').AppSettings>} Updated settings
 */
export async function updateDefaultLanguage(language, currentSettings) {
  if (language !== 'en' && language !== 'ur') {
    throw new Error('Invalid language code');
  }

  const updated = {
    ...currentSettings,
    defaultLanguage: language,
  };
  await saveSettings(updated);
  return updated;
}
