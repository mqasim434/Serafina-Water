/**
 * useTranslation Hook
 * 
 * Custom hook for accessing translations
 */

import { useSelector } from 'react-redux';
import { getTranslation } from '../../features/i18n/translations.js';

/**
 * Custom hook for translations
 * @returns {{t: function, currentLanguage: string}}
 */
export function useTranslation() {
  const { currentLanguage, translations } = useSelector((state) => state.i18n);

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @returns {string} Translated string
   */
  const t = (key) => {
    return getTranslation(key, currentLanguage, translations);
  };

  return { t, currentLanguage };
}
