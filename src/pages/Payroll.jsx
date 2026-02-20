/**
 * Payroll Page (Admin only)
 * Employee pay schedules, Mark Paid, payment history
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { isAdmin } from '../features/auth/service.js';
import {
  setLoading,
  setEmployees,
  setPayments,
  addEmployee,
  updateEmployeeInState,
  addPayment,
  setPaymentsFull,
  setError,
  payrollService,
} from '../features/payroll/slice.js';
import { addExpense, setExpenses } from '../features/expenses/slice.js';
import { expensesService } from '../features/expenses/slice.js';
import { setCashBalance } from '../features/orders/slice.js';
import * as cashService from '../features/cash/service.js';

const PAY_TYPES = { MONTHLY: 'monthly', BIMONTHLY: 'bimonthly' };

export function Payroll() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { employees, payments, isLoading, error } = useSelector((state) => state.payroll);
  const { items: expenses } = useSelector((state) => state.expenses);

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [markPaidEmployee, setMarkPaidEmployee] = useState(null);
  const [paymentHistoryEmployee, setPaymentHistoryEmployee] = useState(null);

  const today = cashService.getTodayDate();
  const payDueToday = payrollService.getPayDueToday(employees, today);
  const payDueSoon = payrollService.getPayDueSoon(employees, today);

  useEffect(() => {
    async function load() {
      dispatch(setLoading(true));
      try {
        const [loadedEmployees, loadedPayments, loadedExpenses] = await Promise.all([
          payrollService.loadEmployees(),
          payrollService.loadPayments(),
          expensesService.loadExpenses(),
        ]);
        dispatch(setEmployees(loadedEmployees));
        dispatch(setPaymentsFull(loadedPayments));
        dispatch(setExpenses(loadedExpenses));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }
    load();
  }, [dispatch]);

  if (!isAdmin(user)) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {t('accessDenied')}
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter((e) => e.isActive);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('payroll')}</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {/* Pay Due Today / Soon */}
      {(payDueToday.length > 0 || payDueSoon.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {payDueToday.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">{t('payDueToday')}</h3>
              <ul className="space-y-2">
                {payDueToday.map((emp) => (
                  <li key={emp.id} className="flex justify-between items-center">
                    <span className="font-medium">{emp.name} — Rs. {(emp.payAmount || 0).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setMarkPaidEmployee(emp)}
                      className="px-3 py-1 bg-amber-600 text-white rounded text-sm font-medium hover:bg-amber-700"
                    >
                      {t('markPaid')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {payDueSoon.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">{t('payDueSoon')}</h3>
              <ul className="space-y-2">
                {payDueSoon.map((emp) => (
                  <li key={emp.id} className="flex justify-between items-center">
                    <span>{emp.name} — {emp.nextPayDate} — Rs. {(emp.payAmount || 0).toLocaleString()}</span>
                    <button
                      type="button"
                      onClick={() => setMarkPaidEmployee(emp)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700"
                    >
                      {t('markPaid')}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('employees')}</h2>
          <button
            type="button"
            onClick={() => setShowAddEmployee(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            {t('add')} {t('employee')}
          </button>
        </div>
        {employees.length === 0 ? (
          <p className="text-gray-500 py-4">{t('noEmployees')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('name')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('payType')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('payAmount')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('payDates')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('nextPayDate')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('status')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees.map((emp) => (
                  <tr key={emp.id} className={!emp.isActive ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {emp.payType === 'bimonthly' ? t('bimonthly') : t('monthly')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Rs. {(emp.payAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {(emp.payDates || []).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{emp.nextPayDate || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={emp.isActive ? 'text-green-600' : 'text-gray-500'}>
                        {emp.isActive ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {emp.isActive && (
                        <button
                          type="button"
                          onClick={() => setMarkPaidEmployee(emp)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                        >
                          {t('markPaid')}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPaymentHistoryEmployee(emp)}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        {t('paymentHistory')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <AddEmployeeForm
          onClose={() => setShowAddEmployee(false)}
          onSubmit={async (data) => {
            const emp = await payrollService.createEmployee(data, employees);
            dispatch(addEmployee(emp));
            setShowAddEmployee(false);
          }}
          isLoading={isLoading}
          t={t}
        />
      )}

      {/* Mark Paid Modal */}
      {markPaidEmployee && (
        <MarkPaidModal
          employee={markPaidEmployee}
          onClose={() => setMarkPaidEmployee(null)}
          onSubmit={async (paidDate, amount, notes) => {
            dispatch(setLoading(true));
            dispatch(setError(null));
            try {
              const cash = await cashService.loadCurrentBalance();
              const cashNum = typeof cash === 'number' ? cash : (cash?.amount ?? 0);
              const result = await payrollService.markPaid(
                markPaidEmployee.id,
                paidDate,
                amount,
                notes,
                user?.id,
                employees,
                payments,
                cashNum,
                expenses
              );
              dispatch(updateEmployeeInState(result.employee));
              dispatch(setPaymentsFull(result.payments));
              dispatch(addExpense(result.expense));
              dispatch(setCashBalance({ amount: result.newCashBalance, lastUpdated: new Date().toISOString() }));
              setMarkPaidEmployee(null);
            } catch (err) {
              dispatch(setError(err.message));
            } finally {
              dispatch(setLoading(false));
            }
          }}
          isLoading={isLoading}
          t={t}
        />
      )}

      {/* Payment History Modal */}
      {paymentHistoryEmployee && (
        <PaymentHistoryModal
          employee={paymentHistoryEmployee}
          payments={payrollService.getPaymentsForEmployee(paymentHistoryEmployee.id, payments)}
          onClose={() => setPaymentHistoryEmployee(null)}
          t={t}
        />
      )}
    </div>
  );
}

function AddEmployeeForm({ onClose, onSubmit, isLoading, t }) {
  const today = cashService.getTodayDate();
  const [form, setForm] = useState({
    name: '',
    payType: 'monthly',
    payAmount: '',
    payDates: '1',
    startDate: today,
    isActive: true,
  });
  const [err, setErr] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      setErr({ name: t('required') });
      return;
    }
    if (!form.payAmount || parseFloat(form.payAmount) <= 0) {
      setErr({ payAmount: 'Amount required' });
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{t('add')} {t('employee')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('name')} *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.name && <p className="text-red-600 text-sm mt-1">{err.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('payType')}</label>
            <select
              value={form.payType}
              onChange={(e) => setForm({ ...form, payType: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="monthly">{t('monthly')}</option>
              <option value="bimonthly">{t('bimonthly')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('payAmount')} (Rs.) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.payAmount}
              onChange={(e) => setForm({ ...form, payAmount: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.payAmount && <p className="text-red-600 text-sm mt-1">{err.payAmount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('payDates')}</label>
            <input
              type="text"
              placeholder="e.g. 1, 15 for 1st and 15th"
              value={form.payDates}
              onChange={(e) => setForm({ ...form, payDates: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('startDate')}</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">{t('active')}</label>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkPaidModal({ employee, onClose, onSubmit, isLoading, t }) {
  const today = cashService.getTodayDate();
  const [paidDate, setPaidDate] = useState(today);
  const [amount, setAmount] = useState(String(employee.payAmount || 0));
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{t('markPaid')} — {employee.name}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(paidDate, parseFloat(amount) || employee.payAmount, notes);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('paidDate')}</label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              max={today}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('amount')} (Rs.)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              {t('markPaid')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentHistoryModal({ employee, payments, onClose, t }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{t('paymentHistory')} — {employee.name}</h3>
        {payments.length === 0 ? (
          <p className="text-gray-500">{t('noPayments')}</p>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span>{p.paidDate}</span>
                <span className="font-medium">Rs. {(p.amount || 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
