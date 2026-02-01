/**
 * Orders Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as ordersService from './service.js';

const initialState = {
  items: [],
  cashBalance: {
    amount: 0,
    lastUpdated: new Date().toISOString(),
  },
  isLoading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setOrders: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addOrder: (state, action) => {
      state.items.push(action.payload);
      state.error = null;
    },
    updateOrderInState: (state, action) => {
      const index = state.items.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      state.error = null;
    },
    setCashBalance: (state, action) => {
      state.cashBalance = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setOrders,
  addOrder,
  updateOrderInState,
  setCashBalance,
  setError,
} = ordersSlice.actions;

// Export service functions for use in thunks/components
export { ordersService };

export default ordersSlice.reducer;
