/**
 * Water Quality Form Component
 * 
 * Form for daily water quality entry
 */

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import * as cashService from '../../../features/cash/service.js';

/**
 * Water Quality Form props
 * @typedef {Object} WaterQualityFormProps
 * @property {function(string, number, number, number): void} onSubmit - Submit handler
 * @property {function(): void} onCancel - Cancel handler
 * @property {boolean} isLoading - Loading state
 */

/**
 * Water Quality Form component
 * @param {WaterQualityFormProps} props
 */
export function WaterQualityForm({ onSubmit, onCancel, isLoading }) {
  const { t } = useTranslation();
  const { ranges } = useSelector((state) => state.waterQuality);
  const { items: entries } = useSelector((state) => state.waterQuality);

  const today = cashService.getTodayDate();
  const [formData, setFormData] = useState({
    date: today,
    pH: '',
    tds: '',
    chlorine: '',
  });

  const [errors, setErrors] = useState({});

  // Check if entry exists for selected date
  const entryExists = entries.some((entry) => entry.date === formData.date);

  useEffect(() => {
    if (entryExists && formData.date === today) {
      setErrors((prev) => ({
        ...prev,
        date: t('entryExistsForDate'),
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        date: undefined,
      }));
    }
  }, [formData.date, entryExists, today, t]);

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

  const handleSubmit = (e) => {
    e.preventDefault();

    const pH = parseFloat(formData.pH);
    const tds = parseFloat(formData.tds);
    const chlorine = parseFloat(formData.chlorine);
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = t('dateRequired');
    }

    if (entryExists) {
      newErrors.date = t('entryExistsForDate');
    }

    if (formData.pH === '' || isNaN(pH) || pH < 0 || pH > 14) {
      newErrors.pH = t('pHInvalid');
    }

    if (formData.tds === '' || isNaN(tds) || tds < 0) {
      newErrors.tds = t('tdsInvalid');
    }

    if (formData.chlorine === '' || isNaN(chlorine) || chlorine < 0) {
      newErrors.chlorine = t('chlorineInvalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData.date, pH, tds, chlorine);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Safe Ranges Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">{t('safeRanges')}:</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <div>
            <strong>pH:</strong> {ranges.pHMin} - {ranges.pHMax}
          </div>
          <div>
            <strong>TDS:</strong> ≤ {ranges.tdsMax} ppm
          </div>
          <div>
            <strong>{t('chlorine')}:</strong> {ranges.chlorineMin} - {ranges.chlorineMax}
          </div>
        </div>
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
        <label htmlFor="pH" className="block text-sm font-medium text-gray-700">
          pH {t('level')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="pH"
          name="pH"
          step="0.1"
          min="0"
          max="14"
          value={formData.pH}
          onChange={handleChange}
          placeholder="7.0"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.pH ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.pH && <p className="mt-1 text-sm text-red-600">{errors.pH}</p>}
      </div>

      <div>
        <label htmlFor="tds" className="block text-sm font-medium text-gray-700">
          TDS {t('level')} (ppm) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="tds"
          name="tds"
          step="1"
          min="0"
          value={formData.tds}
          onChange={handleChange}
          placeholder="200"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.tds ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.tds && <p className="mt-1 text-sm text-red-600">{errors.tds}</p>}
      </div>

      <div>
        <label htmlFor="chlorine" className="block text-sm font-medium text-gray-700">
          {t('chlorine')} {t('level')} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="chlorine"
          name="chlorine"
          step="0.1"
          min="0"
          value={formData.chlorine}
          onChange={handleChange}
          placeholder="1.0"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            errors.chlorine ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.chlorine && <p className="mt-1 text-sm text-red-600">{errors.chlorine}</p>}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || entryExists}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? t('loading') : t('save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
}
