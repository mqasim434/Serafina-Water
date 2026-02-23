/**
 * Maintenance Page (Admin only)
 * Equipment/Cleaning tasks + Certificate expiry tracking
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { LoadingButton } from '../shared/components/LoadingButton.jsx';
import { isAdmin } from '../features/auth/service.js';
import {
  setLoading,
  setTasks,
  setEquipmentHistory,
  setCertificateRenewals,
  addTask,
  updateTaskInState,
  setEquipmentHistoryFull,
  setCertificateRenewalsFull,
  setError,
  maintenanceService,
} from '../features/maintenance/slice.js';
import { uploadDeliveryProof } from '../features/delivery/imagekit.js';
import { isImageKitConfigured } from '../features/delivery/imagekit.js';
import * as cashService from '../features/cash/service.js';

const TASK_TYPES = { EQUIPMENT: 'equipment', CERTIFICATE: 'certificate' };
const TABS = { EQUIPMENT: 'equipment', CERTIFICATE: 'certificate' };

export function Maintenance() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const { items: users } = useSelector((state) => state.users);
  const { tasks, equipmentHistory, certificateRenewals, isLoading, error } = useSelector(
    (state) => state.maintenance
  );

  const [activeTab, setActiveTab] = useState(TABS.EQUIPMENT);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddCertificate, setShowAddCertificate] = useState(false);
  const [markDoneTask, setMarkDoneTask] = useState(null);
  const [markRenewedTask, setMarkRenewedTask] = useState(null);
  const [historyTask, setHistoryTask] = useState(null);
  const [renewalTask, setRenewalTask] = useState(null);
  const [viewingCertificateTask, setViewingCertificateTask] = useState(null);

  const today = cashService.getTodayDate();

  useEffect(() => {
    async function load() {
      dispatch(setLoading(true));
      try {
        const [loadedTasks, loadedHistory, loadedRenewals] = await Promise.all([
          maintenanceService.loadTasks(),
          maintenanceService.loadEquipmentHistory(),
          maintenanceService.loadCertificateRenewals(),
        ]);
        dispatch(setTasks(loadedTasks));
        dispatch(setEquipmentHistory(loadedHistory));
        dispatch(setCertificateRenewals(loadedRenewals));
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

  const equipmentTasks = tasks.filter((t) => t.taskType === 'equipment');
  const certificateTasks = tasks.filter((t) => t.taskType === 'certificate');
  const maintenanceDue = maintenanceService.getMaintenanceDueTodayOrOverdue(tasks, today);
  const certsExpiringSoon = maintenanceService.getCertificatesExpiringSoon(tasks, today);
  const certsExpired = maintenanceService.getCertificatesExpired(tasks, today);

  const getUserName = (id) => {
    const u = users?.find((x) => x.id === id);
    return u ? (u.displayName || u.username || u.role) : id;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('maintenance')}</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab(TABS.EQUIPMENT)}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === TABS.EQUIPMENT ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t('equipmentCleaning')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab(TABS.CERTIFICATE)}
            className={`py-2 px-1 border-b-2 text-sm font-medium ${
              activeTab === TABS.CERTIFICATE ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'
            }`}
          >
            {t('certificatesPaperwork')}
          </button>
        </nav>
      </div>

      {/* Equipment / Cleaning */}
      {activeTab === TABS.EQUIPMENT && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('equipmentCleaning')}</h2>
            <button
              type="button"
              onClick={() => setShowAddEquipment(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {t('add')} {t('equipmentTask')}
            </button>
          </div>
          {equipmentTasks.length === 0 ? (
            <p className="text-gray-500 py-4">{t('noEquipmentTasks')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('itemName')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('lastDoneDate')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('nextDueDate')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('frequency')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {equipmentTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.itemName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.lastDoneDate || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.nextDueDate || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {task.frequencyDays ? `Every ${task.frequencyDays} days` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setMarkDoneTask(task)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                        >
                          {t('markDone')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryTask(task)}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          {t('history')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Certificates */}
      {activeTab === TABS.CERTIFICATE && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('certificatesPaperwork')}</h2>
            <button
              type="button"
              onClick={() => setShowAddCertificate(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              {t('add')} {t('certificate')}
            </button>
          </div>
          {certificateTasks.length === 0 ? (
            <p className="text-gray-500 py-4">{t('noCertificates')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('documentName')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('documentType')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('expiryDate')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {certificateTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{task.documentName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.documentType || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{task.expiryDate}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingCertificateTask(task)}
                          className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded mr-2"
                          title={t('viewDetails')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMarkRenewedTask(task)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                        >
                          {t('markRenewed')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenewalTask(task)}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          {t('renewalHistory')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Modal */}
      {showAddEquipment && (
        <AddEquipmentForm
          onClose={() => setShowAddEquipment(false)}
          onSubmit={async (data) => {
            dispatch(setLoading(true));
            dispatch(setError(null));
            try {
              const task = await maintenanceService.createEquipmentTask(data, tasks);
              dispatch(addTask(task));
              setShowAddEquipment(false);
            } catch (err) {
              dispatch(setError(err.message));
            } finally {
              dispatch(setLoading(false));
            }
          }}
          isLoading={isLoading}
        />
      )}

      {/* Add Certificate Modal */}
      {showAddCertificate && (
        <AddCertificateForm
          onClose={() => setShowAddCertificate(false)}
          onSubmit={async (data) => {
            dispatch(setLoading(true));
            dispatch(setError(null));
            try {
              const task = await maintenanceService.createCertificateTask(data, tasks);
              dispatch(addTask(task));
              setShowAddCertificate(false);
            } catch (err) {
              dispatch(setError(err.message));
            } finally {
              dispatch(setLoading(false));
            }
          }}
          isLoading={isLoading}
        />
      )}

      {/* Mark Done Modal */}
      {markDoneTask && (
        <MarkDoneModal
          task={markDoneTask}
          onClose={() => setMarkDoneTask(null)}
          onSubmit={async (doneDate, notes) => {
            dispatch(setLoading(true));
            dispatch(setError(null));
            try {
              const { task, history } = await maintenanceService.markEquipmentDone(
                markDoneTask.id,
                doneDate,
                notes,
                user?.id,
                tasks,
                equipmentHistory
              );
              dispatch(updateTaskInState(task));
              dispatch(setEquipmentHistoryFull(history));
              setMarkDoneTask(null);
            } catch (err) {
              dispatch(setError(err.message));
            } finally {
              dispatch(setLoading(false));
            }
          }}
          isLoading={isLoading}
        />
      )}

      {/* Mark Renewed Modal */}
      {markRenewedTask && (
        <MarkRenewedModal
          task={markRenewedTask}
          onClose={() => setMarkRenewedTask(null)}
          onSubmit={async (newExpiryDate, attachmentUrl, attachmentFileId, notes) => {
            dispatch(setLoading(true));
            dispatch(setError(null));
            try {
              const { task, renewals } = await maintenanceService.markCertificateRenewed(
                markRenewedTask.id,
                newExpiryDate,
                attachmentUrl,
                attachmentFileId,
                notes,
                user?.id,
                tasks,
                certificateRenewals
              );
              dispatch(updateTaskInState(task));
              dispatch(setCertificateRenewalsFull(renewals));
              setMarkRenewedTask(null);
            } catch (err) {
              dispatch(setError(err.message));
            } finally {
              dispatch(setLoading(false));
            }
          }}
          isLoading={isLoading}
        />
      )}

      {/* Equipment History Modal */}
      {historyTask && (
        <HistoryModal
          task={historyTask}
          history={maintenanceService.getEquipmentHistoryForTask(historyTask.id, equipmentHistory)}
          getUserName={getUserName}
          onClose={() => setHistoryTask(null)}
        />
      )}

      {/* Certificate Renewal History Modal */}
      {renewalTask && (
        <RenewalHistoryModal
          task={renewalTask}
          renewals={maintenanceService.getCertificateRenewalsForTask(renewalTask.id, certificateRenewals)}
          getUserName={getUserName}
          onClose={() => setRenewalTask(null)}
        />
      )}

      {/* Certificate Details & History Modal (eye icon) */}
      {viewingCertificateTask && (
        <CertificateDetailsModal
          task={viewingCertificateTask}
          renewals={maintenanceService.getCertificateRenewalsForTask(viewingCertificateTask.id, certificateRenewals)}
          getUserName={getUserName}
          onClose={() => setViewingCertificateTask(null)}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function AddEquipmentForm({ onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const today = cashService.getTodayDate();
  const [form, setForm] = useState({
    itemName: '',
    lastDoneDate: '',
    frequencyDays: '',
    nextDueDate: '',
    notes: '',
  });
  const [err, setErr] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.itemName?.trim()) {
      setErr({ itemName: t('required') });
      return;
    }
    if (!form.frequencyDays && !form.nextDueDate) {
      setErr({ frequencyDays: 'Enter frequency (days) or next due date' });
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{t('add')} {t('equipmentTask')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('itemName')} *</label>
            <input
              type="text"
              value={form.itemName}
              onChange={(e) => setForm({ ...form, itemName: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.itemName && <p className="text-red-600 text-sm mt-1">{err.itemName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('lastDoneDate')}</label>
            <input
              type="date"
              value={form.lastDoneDate}
              onChange={(e) => setForm({ ...form, lastDoneDate: e.target.value })}
              max={today}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('frequency')} (days)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 7"
              value={form.frequencyDays}
              onChange={(e) => setForm({ ...form, frequencyDays: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.frequencyDays && <p className="text-red-600 text-sm mt-1">{err.frequencyDays}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('nextDueDate')} (or use frequency)</label>
            <input
              type="date"
              value={form.nextDueDate}
              onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <LoadingButton type="button" variant="secondary" onClick={onClose}>
              {t('cancel')}
            </LoadingButton>
            <LoadingButton type="submit" isLoading={isLoading}>
              {t('save')}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCertificateForm({ onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    documentName: '',
    documentType: '',
    issuedDate: '',
    expiryDate: '',
    reminderDaysBefore: '30',
    notes: '',
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [err, setErr] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.documentName?.trim()) {
      setErr({ documentName: t('required') });
      return;
    }
    if (!form.expiryDate) {
      setErr({ expiryDate: t('required') });
      return;
    }
    let attachmentUrl = null;
    let attachmentFileId = null;
    if (attachmentFile && isImageKitConfigured()) {
      try {
        const res = await uploadDeliveryProof(attachmentFile, 'maintenance');
        attachmentUrl = res.url;
        attachmentFileId = res.fileId;
      } catch (e) {
        setErr({ attachment: e.message });
        return;
      }
    }
    onSubmit({ ...form, attachmentUrl, attachmentFileId });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{t('add')} {t('certificate')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('documentName')} *</label>
            <input
              type="text"
              value={form.documentName}
              onChange={(e) => setForm({ ...form, documentName: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.documentName && <p className="text-red-600 text-sm mt-1">{err.documentName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('documentType')}</label>
            <input
              type="text"
              placeholder="e.g. License, Permit"
              value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('issuedDate')}</label>
            <input
              type="date"
              value={form.issuedDate}
              onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('expiryDate')} *</label>
            <input
              type="date"
              value={form.expiryDate}
              onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.expiryDate && <p className="text-red-600 text-sm mt-1">{err.expiryDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('reminderDaysBefore')}</label>
            <input
              type="number"
              min="1"
              value={form.reminderDaysBefore}
              onChange={(e) => setForm({ ...form, reminderDaysBefore: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          {isImageKitConfigured() && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('attachment')}</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm"
              />
              {err.attachment && <p className="text-red-600 text-sm mt-1">{err.attachment}</p>}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <LoadingButton type="button" variant="secondary" onClick={onClose}>
              {t('cancel')}
            </LoadingButton>
            <LoadingButton type="submit" isLoading={isLoading}>
              {t('save')}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkDoneModal({ task, onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const today = cashService.getTodayDate();
  const [doneDate, setDoneDate] = useState(today);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{t('markDone')} — {task.itemName}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(doneDate, notes);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('doneDate')}</label>
            <input
              type="date"
              value={doneDate}
              onChange={(e) => setDoneDate(e.target.value)}
              max={today}
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
            <LoadingButton type="button" variant="secondary" onClick={onClose}>
              {t('cancel')}
            </LoadingButton>
            <LoadingButton type="submit" isLoading={isLoading}>
              {t('markDone')}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function MarkRenewedModal({ task, onClose, onSubmit, isLoading }) {
  const { t } = useTranslation();
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [err, setErr] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newExpiryDate) {
      setErr({ newExpiryDate: t('required') });
      return;
    }
    let attachmentUrl = null;
    let attachmentFileId = null;
    if (attachmentFile && isImageKitConfigured()) {
      try {
        const res = await uploadDeliveryProof(attachmentFile, 'maintenance');
        attachmentUrl = res.url;
        attachmentFileId = res.fileId;
      } catch (e) {
        setErr({ attachment: e.message });
        return;
      }
    }
    onSubmit(newExpiryDate, attachmentUrl, attachmentFileId, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">{t('markRenewed')} — {task.documentName}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('newExpiryDate')} *</label>
            <input
              type="date"
              value={newExpiryDate}
              onChange={(e) => setNewExpiryDate(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {err.newExpiryDate && <p className="text-red-600 text-sm mt-1">{err.newExpiryDate}</p>}
          </div>
          {isImageKitConfigured() && (
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('attachment')}</label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm"
              />
              {err.attachment && <p className="text-red-600 text-sm mt-1">{err.attachment}</p>}
            </div>
          )}
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
            <LoadingButton type="button" variant="secondary" onClick={onClose}>
              {t('cancel')}
            </LoadingButton>
            <LoadingButton type="submit" isLoading={isLoading}>
              {t('markRenewed')}
            </LoadingButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryModal({ task, history, getUserName, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{t('history')} — {task.itemName}</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">{t('noHistory')}</p>
        ) : (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="flex justify-between items-start py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium">{h.doneDate}</span>
                  {h.notes && <p className="text-sm text-gray-600">{h.notes}</p>}
                </div>
                <span className="text-sm text-gray-500">{getUserName(h.doneBy)}</span>
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

function RenewalHistoryModal({ task, renewals, getUserName, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">{t('renewalHistory')} — {task.documentName}</h3>
        {renewals.length === 0 ? (
          <p className="text-gray-500">{t('noRenewals')}</p>
        ) : (
          <ul className="space-y-2">
            {renewals.map((r) => (
              <li key={r.id} className="flex justify-between items-start py-2 border-b border-gray-100">
                <div>
                  <span className="font-medium">{r.renewedDate} → {r.newExpiryDate}</span>
                  {r.notes && <p className="text-sm text-gray-600">{r.notes}</p>}
                </div>
                <span className="text-sm text-gray-500">{getUserName(r.renewedBy)}</span>
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

function CertificateDetailsModal({ task, renewals, getUserName, onClose }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('documentDetails')} — {task.documentName}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
            aria-label={t('close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-500">{t('documentType')}</p>
              <p className="text-gray-900">{task.documentType || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t('issuedDate')}</p>
              <p className="text-gray-900">{task.issuedDate || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t('expiryDate')}</p>
              <p className="text-gray-900">{task.expiryDate || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-gray-500">{t('reminderDaysBefore')}</p>
              <p className="text-gray-900">{task.reminderDaysBefore ?? '—'}</p>
            </div>
          </div>
          {task.notes && (
            <div>
              <p className="font-medium text-gray-500 text-sm">{t('notes')}</p>
              <p className="text-gray-900 text-sm">{task.notes}</p>
            </div>
          )}

          {task.attachmentUrl && (
            <div>
              <p className="font-medium text-gray-500 text-sm mb-2">{t('currentDocument')}</p>
              <a
                href={task.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg overflow-hidden border border-gray-200 max-w-xs"
              >
                {task.attachmentUrl.match(/\.(pdf)$/i) ? (
                  <span className="block px-4 py-3 bg-gray-100 text-gray-600 text-sm">{t('viewPdf')}</span>
                ) : (
                  <img src={task.attachmentUrl} alt={task.documentName} className="w-full h-auto object-contain max-h-48" />
                )}
              </a>
            </div>
          )}

          <div>
            <p className="font-medium text-gray-500 text-sm mb-2">{t('renewalHistory')}</p>
            {renewals.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('noRenewals')}</p>
            ) : (
              <ul className="space-y-3">
                {renewals.map((r) => (
                  <li key={r.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="font-medium text-sm">{r.renewedDate} → {r.newExpiryDate}</span>
                        <span className="text-gray-500 text-sm ml-2">({getUserName(r.renewedBy)})</span>
                      </div>
                    </div>
                    {r.notes && <p className="text-sm text-gray-600 mt-1">{r.notes}</p>}
                    {r.attachmentUrl && (
                      <div className="mt-2">
                        {r.attachmentUrl.match(/\.(pdf)$/i) ? (
                          <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                            {t('viewPdf')}
                          </a>
                        ) : (
                          <a href={r.attachmentUrl} target="_blank" rel="noopener noreferrer" className="block rounded overflow-hidden border border-gray-200 max-w-[200px]">
                            <img src={r.attachmentUrl} alt="" className="w-full h-auto object-contain max-h-32" />
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
