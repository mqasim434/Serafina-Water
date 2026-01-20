/**
 * Settings Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as settingsService from './service.js';

const initialState = {
  settings: null,
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSettings: (state, action) => {
      state.settings = action.payload;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const { setLoading, setSettings, setError } = settingsSlice.actions;

// Export service functions for use in thunks/components
export { settingsService };

export default settingsSlice.reducer;
