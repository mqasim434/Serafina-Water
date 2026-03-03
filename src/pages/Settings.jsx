/**
 * Settings Page
 * 
 * Main page for application settings (Admin only)
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { LoadingButton } from '../shared/components/LoadingButton.jsx';
import {
  setLoading,
  setSettings,
  setError,
} from '../features/settings/slice.js';
import { settingsService } from '../features/settings/slice.js';
import { setLanguage } from '../features/i18n/slice.js';
import { waterQualityService } from '../features/waterQuality/slice.js';
import { setRanges } from '../features/waterQuality/slice.js';

const SETTINGS_SECTIONS = {
  COMPANY: 'company',
  LANGUAGE: 'language',
  WATER_QUALITY: 'water_quality',
};

export function Settings() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { settings, isLoading, error } = useSelector((state) => state.settings);
  const { ranges: waterQualityRanges } = useSelector((state) => state.waterQuality);

  const [activeSection, setActiveSection] = useState(SETTINGS_SECTIONS.COMPANY);
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    defaultLanguage: 'en',
  });

  const [waterQualityFormData, setWaterQualityFormData] = useState({
    pHMin: 6.5,
    pHMax: 8.5,
    tdsMax: 300,
    chlorineMin: 0.2,
    chlorineMax: 2.0,
    warningTolerance: 10,
  });

  // Load settings on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const [loadedSettings, loadedRanges] = await Promise.all([
          settingsService.loadSettings(),
          waterQualityService.loadWaterQualityRanges(),
        ]);
        dispatch(setSettings(loadedSettings));
        dispatch(setRanges(loadedRanges));
        setFormData({
          companyName: loadedSettings.companyInfo?.name || '',
          companyAddress: loadedSettings.companyInfo?.address || '',
          companyPhone: loadedSettings.companyInfo?.phone || '',
          companyEmail: loadedSettings.companyInfo?.email || '',
          companyWebsite: loadedSettings.companyInfo?.website || '',
          defaultLanguage: loadedSettings.defaultLanguage || 'en',
        });
        setWaterQualityFormData({
          pHMin: loadedRanges.pHMin || 6.5,
          pHMax: loadedRanges.pHMax || 8.5,
          tdsMax: loadedRanges.tdsMax || 300,
          chlorineMin: loadedRanges.chlorineMin || 0.2,
          chlorineMax: loadedRanges.chlorineMax || 2.0,
          warningTolerance: loadedRanges.warningTolerance || 10,
        });
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
  }, [dispatch]);

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const updated = await settingsService.updateCompanyInfo(
        {
          name: formData.companyName,
          address: formData.companyAddress,
          phone: formData.companyPhone,
          email: formData.companyEmail,
          website: formData.companyWebsite,
        },
        settings
      );
      dispatch(setSettings(updated));
      alert(t('settingsSaved'));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleLanguageChange = async (e) => {
    const newLanguage = e.target.value;
    dispatch(setLoading(true));
    try {
      const updated = await settingsService.updateDefaultLanguage(newLanguage, settings);
      dispatch(setSettings(updated));
      dispatch(setLanguage(newLanguage));
      alert(t('settingsSaved'));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleWaterQualitySubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const updatedRanges = {
        pHMin: parseFloat(waterQualityFormData.pHMin),
        pHMax: parseFloat(waterQualityFormData.pHMax),
        tdsMax: parseFloat(waterQualityFormData.tdsMax),
        chlorineMin: parseFloat(waterQualityFormData.chlorineMin),
        chlorineMax: parseFloat(waterQualityFormData.chlorineMax),
        warningTolerance: parseFloat(waterQualityFormData.warningTolerance),
      };
      await waterQualityService.saveWaterQualityRanges(updatedRanges);
      dispatch(setRanges(updatedRanges));
      alert(t('settingsSaved'));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 space-y-2">
              <button
                onClick={() => setActiveSection(SETTINGS_SECTIONS.COMPANY)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeSection === SETTINGS_SECTIONS.COMPANY
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('companyInfo')}
              </button>
              <button
                onClick={() => setActiveSection(SETTINGS_SECTIONS.LANGUAGE)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeSection === SETTINGS_SECTIONS.LANGUAGE
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('language')}
              </button>
              <button
                onClick={() => setActiveSection(SETTINGS_SECTIONS.WATER_QUALITY)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeSection === SETTINGS_SECTIONS.WATER_QUALITY
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('waterQualityRanges')}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === SETTINGS_SECTIONS.COMPANY && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('companyInfo')}</h2>
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    {t('companyName')}
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyName: e.target.value }))
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="companyAddress"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('address')}
                  </label>
                  <textarea
                    id="companyAddress"
                    rows={3}
                    value={formData.companyAddress}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyAddress: e.target.value }))
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700">
                    {t('phone')}
                  </label>
                  <input
                    type="text"
                    id="companyPhone"
                    value={formData.companyPhone}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyPhone: e.target.value }))
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    id="companyEmail"
                    value={formData.companyEmail}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyEmail: e.target.value }))
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="companyWebsite"
                    className="block text-sm font-medium text-gray-700"
                  >
                    {t('website')}
                  </label>
                  <input
                    type="url"
                    id="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, companyWebsite: e.target.value }))
                    }
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <LoadingButton type="submit" isLoading={isLoading}>
                  {t('save')}
                </LoadingButton>
              </form>
            </div>
          )}

          {activeSection === SETTINGS_SECTIONS.LANGUAGE && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('defaultLanguage')}</h2>
              <div>
                <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700">
                  {t('defaultLanguage')}
                </label>
                <select
                  id="defaultLanguage"
                  value={formData.defaultLanguage}
                  onChange={handleLanguageChange}
                  disabled={isLoading}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="en">{t('english')}</option>
                  <option value="ur">{t('urdu')}</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === SETTINGS_SECTIONS.WATER_QUALITY && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('waterQualityRanges')}</h2>
              <form onSubmit={handleWaterQualitySubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pHMin" className="block text-sm font-medium text-gray-700">
                      pH {t('minimum')}
                    </label>
                    <input
                      type="number"
                      id="pHMin"
                      step="0.1"
                      value={waterQualityFormData.pHMin}
                      onChange={(e) =>
                        setWaterQualityFormData((prev) => ({ ...prev, pHMin: e.target.value }))
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="pHMax" className="block text-sm font-medium text-gray-700">
                      pH {t('maximum')}
                    </label>
                    <input
                      type="number"
                      id="pHMax"
                      step="0.1"
                      value={waterQualityFormData.pHMax}
                      onChange={(e) =>
                        setWaterQualityFormData((prev) => ({ ...prev, pHMax: e.target.value }))
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="tdsMax" className="block text-sm font-medium text-gray-700">
                      TDS {t('maximum')} (ppm)
                    </label>
                    <input
                      type="number"
                      id="tdsMax"
                      step="1"
                      value={waterQualityFormData.tdsMax}
                      onChange={(e) =>
                        setWaterQualityFormData((prev) => ({ ...prev, tdsMax: e.target.value }))
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="chlorineMin" className="block text-sm font-medium text-gray-700">
                      {t('chlorine')} {t('minimum')}
                    </label>
                    <input
                      type="number"
                      id="chlorineMin"
                      step="0.1"
                      value={waterQualityFormData.chlorineMin}
                      onChange={(e) =>
                        setWaterQualityFormData((prev) => ({ ...prev, chlorineMin: e.target.value }))
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="chlorineMax" className="block text-sm font-medium text-gray-700">
                      {t('chlorine')} {t('maximum')}
                    </label>
                    <input
                      type="number"
                      id="chlorineMax"
                      step="0.1"
                      value={waterQualityFormData.chlorineMax}
                      onChange={(e) =>
                        setWaterQualityFormData((prev) => ({ ...prev, chlorineMax: e.target.value }))
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="warningTolerance" className="block text-sm font-medium text-gray-700">
                      {t('warningTolerance')} (%)
                    </label>
                    <input
                      type="number"
                      id="warningTolerance"
                      step="1"
                      min="0"
                      max="100"
                      value={waterQualityFormData.warningTolerance}
                      onChange={(e) =>
                        setWaterQualityFormData((prev) => ({ ...prev, warningTolerance: e.target.value }))
                      }
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('warningToleranceDescription')}</p>
                  </div>
                </div>
                <LoadingButton type="submit" isLoading={isLoading}>
                  {t('save')}
                </LoadingButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
