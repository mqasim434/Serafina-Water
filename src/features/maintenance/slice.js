/**
 * Maintenance Redux Slice
 */

import { createSlice } from '@reduxjs/toolkit';
import * as maintenanceService from './service.js';

const initialState = {
  tasks: [],
  equipmentHistory: [],
  certificateRenewals: [],
  isLoading: false,
  error: null,
};

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setTasks: (state, action) => {
      state.tasks = action.payload;
      state.error = null;
    },
    setEquipmentHistory: (state, action) => {
      state.equipmentHistory = action.payload;
    },
    setCertificateRenewals: (state, action) => {
      state.certificateRenewals = action.payload;
    },
    addTask: (state, action) => {
      state.tasks.push(action.payload);
      state.error = null;
    },
    updateTaskInState: (state, action) => {
      const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) state.tasks[idx] = action.payload;
      state.error = null;
    },
    appendEquipmentHistory: (state, action) => {
      state.equipmentHistory.push(action.payload);
    },
    setEquipmentHistoryFull: (state, action) => {
      state.equipmentHistory = action.payload;
    },
    appendCertificateRenewal: (state, action) => {
      state.certificateRenewals.push(action.payload);
    },
    setCertificateRenewalsFull: (state, action) => {
      state.certificateRenewals = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const {
  setLoading,
  setTasks,
  setEquipmentHistory,
  setCertificateRenewals,
  addTask,
  updateTaskInState,
  appendEquipmentHistory,
  setEquipmentHistoryFull,
  appendCertificateRenewal,
  setCertificateRenewalsFull,
  setError,
} = maintenanceSlice.actions;

export { maintenanceService };
export default maintenanceSlice.reducer;
