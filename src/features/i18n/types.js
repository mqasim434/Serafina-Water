/**
 * Internationalization Types
 * 
 * JSDoc type definitions for i18n feature
 */

/**
 * Supported languages
 * @typedef {'en' | 'ur'} Language
 */

/**
 * Translation keys (extend this as needed)
 * @typedef {Object<string, string>} Translations
 */

/**
 * i18n state
 * @typedef {Object} I18nState
 * @property {Language} currentLanguage - Current active language
 * @property {Object<Language, Translations>} translations - Translation dictionary
 */
