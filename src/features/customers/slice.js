/**
 * Customers Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as customersService from './service.js';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  selectedId: null,
};

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setCustomers: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addCustomer: (state, action) => {
      state.items.push(action.payload);
      state.error = null;
    },
    updateCustomerInState: (state, action) => {
      const index = state.items.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
      state.error = null;
    },
    removeCustomer: (state, action) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
      state.error = null;
      if (state.selectedId === action.payload) {
        state.selectedId = null;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    setSelectedId: (state, action) => {
      state.selectedId = action.payload;
    },
  },
});

export const {
  setLoading,
  setCustomers,
  addCustomer,
  updateCustomerInState,
  removeCustomer,
  setError,
  setSelectedId,
} = customersSlice.actions;

// Export service functions for use in thunks/components
export { customersService };

export default customersSlice.reducer;

