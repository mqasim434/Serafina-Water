/**
 * Payroll Service
 *
 * Employee pay schedules, payment history, expense integration
 */

import { storageService } from '../../shared/services/storage.js';
import * as cashService from '../cash/service.js';

const STORAGE_KEYS = {
  EMPLOYEES: 'payroll_employees',
  PAYMENTS: 'payroll_payments',
};

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function toDateStr(d) {
  return typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
}

export async function loadEmployees() {
  const employees = await storageService.getItem(STORAGE_KEYS.EMPLOYEES);
  return employees || [];
}

export async function saveEmployees(employees) {
  await storageService.setItem(STORAGE_KEYS.EMPLOYEES, employees);
}

export async function loadPayments() {
  const payments = await storageService.getItem(STORAGE_KEYS.PAYMENTS);
  return payments || [];
}

export async function savePayments(payments) {
  await storageService.setItem(STORAGE_KEYS.PAYMENTS, payments);
}

/**
 * Normalize payDates to array of numbers (handles string "1" or "1,15" or array [1])
 */
function normalizePayDates(payDates) {
  let arr;
  if (Array.isArray(payDates) && payDates.length > 0) {
    arr = payDates.map((n) => parseInt(n, 10)).filter((n) => !isNaN(n) && n >= 1 && n <= 28);
  } else {
    const str = String(payDates || '1');
    arr = str.split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 1 && n <= 28);
  }
  return arr.length > 0 ? arr : [1];
}

/**
 * Compute next pay date from last paid date or start date
 */
function computeNextPayDate(lastPaidOrStartDate, payType, payDates) {
  const parts = String(lastPaidOrStartDate).slice(0, 10).split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] || 1);
  const day = d.getDate();
  const month = d.getMonth();
  const year = d.getFullYear();
  const payDatesArr = normalizePayDates(payDates);

  if (payType === 'monthly') {
    const targetDay = payDatesArr[0] || 1;
    if (day < targetDay) {
      d.setDate(targetDay);
      return toDateStr(d);
    }
    d.setMonth(month + 1);
    d.setDate(targetDay);
    return toDateStr(d);
  }

  // biweekly: every 14 days from last paid/start date
  if (payType === 'biweekly') {
    d.setDate(d.getDate() + 14);
    return toDateStr(d);
  }

  // Legacy bimonthly: treat as biweekly (every 14 days) for backwards compatibility
  d.setDate(d.getDate() + 14);
  return toDateStr(d);
}

export async function createEmployee(data, existingEmployees) {
  const payDates = (data.payDates || '1')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 28);
  if (payDates.length === 0) payDates.push(1);

  const startDate = data.startDate || toDateStr(new Date());
  const nextPayDate = computeNextPayDate(startDate, data.payType || 'monthly', payDates);

  const employee = {
    id: generateId('emp'),
    name: data.name.trim(),
    payType: data.payType || 'monthly',
    payAmount: parseFloat(data.payAmount) || 0,
    payDates,
    startDate,
    nextPayDate,
    isActive: data.isActive !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [...existingEmployees, employee];
  await saveEmployees(updated);
  return employee;
}

export async function updateEmployee(id, data, existingEmployees) {
  const idx = existingEmployees.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Employee not found');
  const emp = existingEmployees[idx];
  const payDates = (data.payDates ?? emp.payDates)
    .toString()
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 28);
  const finalPayDates = payDates.length > 0 ? payDates : emp.payDates;

  const updated = {
    ...emp,
    name: (data.name ?? emp.name).trim(),
    payType: data.payType ?? emp.payType,
    payAmount: data.payAmount !== undefined ? parseFloat(data.payAmount) : emp.payAmount,
    payDates: finalPayDates,
    startDate: data.startDate ?? emp.startDate,
    isActive: data.isActive !== undefined ? data.isActive : emp.isActive,
    updatedAt: new Date().toISOString(),
  };
  // Recompute next pay from last payment or start
  const payments = await loadPayments();
  const lastPayment = payments
    .filter((p) => p.employeeId === id)
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))[0];
  const baseDate = lastPayment ? lastPayment.paidDate : updated.startDate;
  updated.nextPayDate = computeNextPayDate(baseDate, updated.payType, updated.payDates);

  const updatedEmployees = [...existingEmployees];
  updatedEmployees[idx] = updated;
  await saveEmployees(updatedEmployees);
  return updated;
}

/**
 * Deactivate an employee (sets isActive to false)
 */
export async function deactivateEmployee(id, existingEmployees) {
  return updateEmployee(id, { isActive: false }, existingEmployees);
}

/**
 * Activate an employee (sets isActive to true)
 */
export async function activateEmployee(id, existingEmployees) {
  return updateEmployee(id, { isActive: true }, existingEmployees);
}

/**
 * Permanently delete an employee (payment history is preserved)
 */
export async function deleteEmployee(id, existingEmployees) {
  const idx = existingEmployees.findIndex((e) => e.id === id);
  if (idx === -1) throw new Error('Employee not found');
  const updated = existingEmployees.filter((e) => e.id !== id);
  await saveEmployees(updated);
  return { deletedId: id };
}

export async function markPaid(
  employeeId,
  paidDate,
  amount,
  notes,
  paidBy,
  existingEmployees,
  existingPayments,
  currentCashBalance,
  existingExpenses
) {
  const empIdx = existingEmployees.findIndex((e) => e.id === employeeId);
  if (empIdx === -1) throw new Error('Employee not found');
  const emp = existingEmployees[empIdx];

  const payment = {
    id: generateId('pay'),
    employeeId,
    paidDate,
    amount: amount ?? emp.payAmount,
    notes: (notes || '').trim() || null,
    paidBy: paidBy || null,
    createdAt: new Date().toISOString(),
  };

  // Create generic expense (no employee name - privacy)
  const expenseData = {
    title: 'Payroll',
    description: '',
    amount: payment.amount,
    date: paidDate,
  };
  const { createExpense } = await import('../expenses/service.js');
  const { expense, newCashBalance } = await createExpense(
    expenseData,
    existingExpenses,
    currentCashBalance,
    paidBy
  );
  payment.expenseId = expense.id;

  const nextPayDate = computeNextPayDate(paidDate, emp.payType, emp.payDates);
  const updatedEmp = { ...emp, nextPayDate, updatedAt: new Date().toISOString() };
  const updatedEmployees = [...existingEmployees];
  updatedEmployees[empIdx] = updatedEmp;
  const updatedPayments = [...existingPayments, payment];

  await saveEmployees(updatedEmployees);
  await savePayments(updatedPayments);

  return {
    employee: updatedEmp,
    payment,
    expense,
    newCashBalance,
    payments: updatedPayments,
  };
}

export function getPaymentsForEmployee(employeeId, payments) {
  return payments
    .filter((p) => p.employeeId === employeeId)
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
}

function toDateKey(d) {
  if (!d) return '';
  const s = String(d);
  return s.slice(0, 10);
}

export function getPayDueSoon(employees, todayStr, payments = []) {
  const todayNorm = toDateKey(todayStr);
  const paidTodayIds = new Set(
    (payments || [])
      .filter((p) => toDateKey(p.paidDate) === todayNorm)
      .map((p) => p.employeeId)
  );
  const [y, m, d] = todayNorm.split('-').map(Number);
  const today = new Date(y, m - 1, d);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  return employees.filter((e) => {
    if (!e.isActive) return false;
    if (paidTodayIds.has(e.id)) return false;
    if (!e.nextPayDate) return false;
    const parts = String(e.nextPayDate).slice(0, 10).split('-').map(Number);
    const dueDate = new Date(parts[0], parts[1] - 1, parts[2] || 1);
    if (Number.isNaN(dueDate.getTime())) return false;
    return dueDate > today && dueDate <= in7Days;
  });
}

export function getPayDueToday(employees, todayStr, payments = []) {
  const todayNorm = toDateKey(todayStr);
  const paidTodayIds = new Set(
    (payments || [])
      .filter((p) => toDateKey(p.paidDate) === todayNorm)
      .map((p) => p.employeeId)
  );
  return employees.filter(
    (e) =>
      e.isActive &&
      !paidTodayIds.has(e.id) &&
      String(e.nextPayDate || '').slice(0, 10) === todayNorm
  );
}
