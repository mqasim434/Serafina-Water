/**
 * i18n Redux Slice
 * 
 * Thin slice for language state management
 */

import { createSlice } from '@reduxjs/toolkit';
import * as i18nService from './service.js';
import { translations } from './translations.js';

const initialState = {
  currentLanguage: i18nService.DEFAULT_LANGUAGE,
  translations,
};

const i18nSlice = createSlice({
  name: 'i18n',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      const language = i18nService.normalizeLanguage(action.payload);
      state.currentLanguage = language;
    },
  },
});

export const { setLanguage } = i18nSlice.actions;

// Export service functions
export { i18nService };

export default i18nSlice.reducer;
