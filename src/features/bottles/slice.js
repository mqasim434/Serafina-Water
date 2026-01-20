/**
 * Bottles Redux Slice
 * 
 * Thin slice - holds state only, all calculations in service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as bottlesService from './service.js';

const initialState = {
  transactions: [],
  isLoading: false,
  error: null,
};

const bottlesSlice = createSlice({
  name: 'bottles',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload;
      state.error = null;
    },
    addTransaction: (state, action) => {
      state.transactions.push(action.payload);
      state.error = null;
    },
    removeTransaction: (state, action) => {
      state.transactions = state.transactions.filter((t) => t.id !== action.payload);
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
  setTransactions,
  addTransaction,
  removeTransaction,
  setError,
} = bottlesSlice.actions;

// Export service functions for use in thunks/components
export { bottlesService };

export default bottlesSlice.reducer;
