/**
 * Payments Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as paymentsService from './service.js';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setPayments: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addPayment: (state, action) => {
      state.items.push(action.payload);
      state.error = null;
    },
    removePayment: (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
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
  setPayments,
  addPayment,
  removePayment,
  setError,
} = paymentsSlice.actions;

// Export service functions for use in thunks/components
export { paymentsService };

export default paymentsSlice.reducer;
