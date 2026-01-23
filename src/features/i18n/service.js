/**
 * i18n Service
 * 
 * Business logic for internationalization
 * Language preference stored in localStorage (client-side only)
 */

import { localStorageService } from '../../shared/services/localStorage.js';

const STORAGE_KEY = 'i18n_language';

/**
 * Default language
 * @type {import('./types.js').Language}
 */
export const DEFAULT_LANGUAGE = 'en';

/**
 * Supported languages
 * @type {import('./types.js').Language[]}
 */
export const SUPPORTED_LANGUAGES = ['en', 'ur'];

/**
 * Check if language is supported
 * @param {string} lang - Language code to check
 * @returns {boolean} True if supported
 */
export function isSupportedLanguage(lang) {
  return SUPPORTED_LANGUAGES.includes(lang);
}

/**
 * Validate and normalize language code
 * @param {string} lang - Language code
 * @returns {import('./types.js').Language} Valid language code or default
 */
export function normalizeLanguage(lang) {
  return isSupportedLanguage(lang) ? lang : DEFAULT_LANGUAGE;
}

/**
 * Persist language preference to localStorage (client-side only)
 * @param {import('./types.js').Language} language - Language to persist
 * @returns {Promise<void>}
 */
export async function persistLanguage(language) {
  localStorageService.setItem(STORAGE_KEY, language);
}

/**
 * Load language preference from localStorage
 * @returns {Promise<import('./types.js').Language>}
 */
export async function loadLanguage() {
  const saved = localStorageService.getItem(STORAGE_KEY);
  return normalizeLanguage(saved);
}
