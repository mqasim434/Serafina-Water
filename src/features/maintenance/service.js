/**
 * Maintenance Service
 *
 * Equipment/cleaning tasks + certificate expiry tracking
 */

import { storageService } from '../../shared/services/storage.js';

const STORAGE_KEYS = {
  TASKS: 'maintenance_tasks',
  EQUIPMENT_HISTORY: 'maintenance_equipment_history',
  CERTIFICATE_RENEWALS: 'maintenance_certificate_renewals',
};

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function loadTasks() {
  const tasks = await storageService.getItem(STORAGE_KEYS.TASKS);
  return tasks || [];
}

export async function saveTasks(tasks) {
  await storageService.setItem(STORAGE_KEYS.TASKS, tasks);
}

export async function loadEquipmentHistory() {
  const history = await storageService.getItem(STORAGE_KEYS.EQUIPMENT_HISTORY);
  return history || [];
}

export async function saveEquipmentHistory(history) {
  await storageService.setItem(STORAGE_KEYS.EQUIPMENT_HISTORY, history);
}

export async function loadCertificateRenewals() {
  const renewals = await storageService.getItem(STORAGE_KEYS.CERTIFICATE_RENEWALS);
  return renewals || [];
}

export async function saveCertificateRenewals(renewals) {
  await storageService.setItem(STORAGE_KEYS.CERTIFICATE_RENEWALS, renewals);
}

// --- Equipment / Cleaning ---

export async function createEquipmentTask(data, existingTasks) {
  const task = {
    id: generateId('eq'),
    taskType: 'equipment',
    itemName: data.itemName.trim(),
    lastDoneDate: data.lastDoneDate || null,
    frequencyDays: data.frequencyDays ? parseInt(data.frequencyDays, 10) : null,
    nextDueDate: data.nextDueDate || null,
    notes: (data.notes || '').trim() || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [...existingTasks, task];
  await saveTasks(updated);
  return task;
}

export async function markEquipmentDone(taskId, doneDate, notes, doneBy, existingTasks, existingHistory, attachmentUrl, attachmentFileId) {
  const idx = existingTasks.findIndex((t) => t.id === taskId);
  if (idx === -1) throw new Error('Task not found');
  const task = existingTasks[idx];
  const freq = task.frequencyDays;
  let nextDue = null;
  if (freq && freq > 0) {
    const d = new Date(doneDate);
    d.setDate(d.getDate() + freq);
    nextDue = d.toISOString().slice(0, 10);
  }
  const updatedTask = {
    ...task,
    lastDoneDate: doneDate,
    nextDueDate: nextDue || task.nextDueDate,
    updatedAt: new Date().toISOString(),
  };
  const entry = {
    id: generateId('eh'),
    taskId,
    doneDate,
    notes: (notes || '').trim() || null,
    ...(attachmentUrl ? { attachmentUrl } : {}),
    ...(attachmentFileId ? { attachmentFileId } : {}),
    doneBy: doneBy || null,
    createdAt: new Date().toISOString(),
  };
  const updatedTasks = [...existingTasks];
  updatedTasks[idx] = updatedTask;
  const updatedHistory = [...existingHistory, entry];
  await saveTasks(updatedTasks);
  await saveEquipmentHistory(updatedHistory);
  return { task: updatedTask, history: updatedHistory };
}

export function getEquipmentHistoryForTask(taskId, history) {
  return history.filter((h) => h.taskId === taskId).sort((a, b) => new Date(b.doneDate) - new Date(a.doneDate));
}

// --- Certificates ---

export async function createCertificateTask(data, existingTasks) {
  const task = {
    id: generateId('cert'),
    taskType: 'certificate',
    documentName: data.documentName.trim(),
    documentType: (data.documentType || '').trim() || null,
    issuedDate: data.issuedDate || null,
    expiryDate: data.expiryDate,
    reminderDaysBefore: parseInt(data.reminderDaysBefore, 10) || 30,
    notes: (data.notes || '').trim() || null,
    attachmentUrl: data.attachmentUrl || null,
    attachmentFileId: data.attachmentFileId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [...existingTasks, task];
  await saveTasks(updated);
  return task;
}

export async function markCertificateRenewed(
  taskId,
  newExpiryDate,
  attachmentUrl,
  attachmentFileId,
  notes,
  renewedBy,
  existingTasks,
  existingRenewals
) {
  const idx = existingTasks.findIndex((t) => t.id === taskId);
  if (idx === -1) throw new Error('Task not found');
  const task = existingTasks[idx];
  const renewedDate = new Date().toISOString().slice(0, 10);
  const updatedTask = {
    ...task,
    expiryDate: newExpiryDate,
    attachmentUrl: attachmentUrl || task.attachmentUrl,
    attachmentFileId: attachmentFileId || task.attachmentFileId,
    updatedAt: new Date().toISOString(),
  };
  const entry = {
    id: generateId('cr'),
    taskId,
    renewedDate,
    newExpiryDate,
    attachmentUrl: attachmentUrl || null,
    attachmentFileId: attachmentFileId || null,
    notes: (notes || '').trim() || null,
    renewedBy: renewedBy || null,
    createdAt: new Date().toISOString(),
  };
  const updatedTasks = [...existingTasks];
  updatedTasks[idx] = updatedTask;
  const updatedRenewals = [...existingRenewals, entry];
  await saveTasks(updatedTasks);
  await saveCertificateRenewals(updatedRenewals);
  return { task: updatedTask, renewals: updatedRenewals };
}

export function getCertificateRenewalsForTask(taskId, renewals) {
  return renewals.filter((r) => r.taskId === taskId).sort((a, b) => new Date(b.renewedDate) - new Date(a.renewedDate));
}

// --- Dashboard helpers ---

function toDateStr(d) {
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
}

export function getMaintenanceDueTodayOrOverdue(tasks, todayStr) {
  return tasks.filter((t) => {
    if (t.taskType !== 'equipment') return false;
    const due = t.nextDueDate || t.lastDoneDate;
    if (!due) return false;
    return toDateStr(due) <= todayStr;
  });
}

export function getCertificatesExpiringSoon(tasks, todayStr) {
  const today = new Date(todayStr);
  return tasks.filter((t) => {
    if (t.taskType !== 'certificate') return false;
    const expiry = new Date(t.expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysLeft <= t.reminderDaysBefore && daysLeft > 0;
  });
}

export function getCertificatesExpired(tasks, todayStr) {
  return tasks.filter((t) => {
    if (t.taskType !== 'certificate') return false;
    return toDateStr(t.expiryDate) < todayStr;
  });
}
