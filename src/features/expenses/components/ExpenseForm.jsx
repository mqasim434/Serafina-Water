/**
 * Expense Form Component
 *
 * Form for adding expenses with optional image upload
 */

import { useState, useRef } from 'react';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';
import * as cashService from '../../../features/cash/service.js';
import { isImageKitConfigured, uploadExpenseImage } from '../../../features/delivery/imagekit.js';

/**
 * Expense Form props
 * @typedef {Object} ExpenseFormProps
 * @property {function(string, string, number, string, string|null, string|null): void} onSubmit - Submit handler (title, description, amount, date, imageUrl, imageFileId)
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 * @property {number} [availableCash] - Available cash balance
 */

/**
 * Expense Form component
 * @param {ExpenseFormProps} props
 */
export function ExpenseForm({ onSubmit, onCancel, isLoading, availableCash }) {
  const { t } = useTranslation();
  const today = cashService.getTodayDate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    date: today,
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setUploadError(t('pleaseSelectImage') || 'Please select an image file');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    const newErrors = {};

    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = t('expenseTitleRequired') || 'Expense title is required';
    }

    if (!formData.date || formData.date.trim() === '') {
      newErrors.date = t('dateRequired');
    }

    if (!formData.amount || amount <= 0) {
      newErrors.amount = t('expenseAmountRequired') || 'Expense amount must be greater than 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let imageUrl = null;
    let imageFileId = null;
    if (photoFile && isImageKitConfigured()) {
      setIsUploading(true);
      setUploadError('');
      try {
        const result = await uploadExpenseImage(photoFile);
        imageUrl = result.url;
        imageFileId = result.fileId;
      } catch (err) {
        setUploadError(err.message || t('uploadFailed') || 'Failed to upload image');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSubmit(formData.title.trim(), formData.description.trim(), amount, formData.date, imageUrl, imageFileId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {availableCash !== undefined && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex justify-between items-center gap-2">
            <span className="text-sm font-medium text-blue-900">{t('cashOnHand')}:</span>
            <span className="text-base sm:text-lg font-bold text-blue-900 truncate">
              Rs. {availableCash.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          {t('expenseTitle') || 'Expense Title'} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.title ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('expenseTitle') || 'Enter expense title'}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          {t('date')} <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          max={today}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.date ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          {t('expenseAmount')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.amount ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder={t('expenseAmount')}
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          {t('expenseDescription')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder={t('expenseDescription')}
        />
      </div>

      {isImageKitConfigured() && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            {t('expenseImage') || 'Receipt/Image'} ({t('optional') || 'Optional'})
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {photoPreview && (
            <div className="mt-2">
              <img
                src={photoPreview}
                alt="Preview"
                className="max-h-40 rounded border border-gray-200"
              />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="mt-2 text-sm text-amber-600 hover:text-amber-700"
              >
                {t('removeImage') || 'Remove image'}
              </button>
            </div>
          )}
          {uploadError && <p className="mt-1 text-sm text-red-600">{uploadError}</p>}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
        <LoadingButton type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          {t('cancel')}
        </LoadingButton>
        <LoadingButton type="submit" isLoading={isLoading || isUploading} variant="danger" disabled={isUploading}>
          {t('addExpense')}
        </LoadingButton>
      </div>
    </form>
  );
}
