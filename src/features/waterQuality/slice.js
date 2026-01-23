/**
 * Water Quality Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as waterQualityService from './service.js';

const initialState = {
  items: [],
  ranges: {
    pHMin: 6.5,
    pHMax: 8.5,
    tdsMax: 300,
    chlorineMin: 0.2,
    chlorineMax: 2.0,
    warningTolerance: 10,
  },
  isLoading: false,
  error: null,
};

const waterQualitySlice = createSlice({
  name: 'waterQuality',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setEntries: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addEntry: (state, action) => {
      state.items.push(action.payload);
      state.error = null;
    },
    setRanges: (state, action) => {
      state.ranges = action.payload;
      state.error = null;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setEntries,
  addEntry,
  setRanges,
  setError,
} = waterQualitySlice.actions;

// Export service functions for use in thunks/components
export { waterQualityService };

export default waterQualitySlice.reducer;
