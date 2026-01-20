/**
 * Users Redux Slice
 * 
 * Thin slice that delegates business logic to service layer
 */

import { createSlice } from '@reduxjs/toolkit';
import * as usersService from './service.js';

const initialState = {
  items: [],
  isLoading: false,
  error: null,
  selectedId: null,
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setUsers: (state, action) => {
      state.items = action.payload;
      state.error = null;
    },
    addUser: (state, action) => {
      state.items.push(action.payload);
    },
    updateUserInState: (state, action) => {
      const index = state.items.findIndex((u) => u.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeUser: (state, action) => {
      state.items = state.items.filter((u) => u.id !== action.payload);
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
  setUsers,
  addUser,
  updateUserInState,
  removeUser,
  setError,
  setSelectedId,
} = usersSlice.actions;

// Export service functions for use in thunks/components
export { usersService };

export default usersSlice.reducer;
