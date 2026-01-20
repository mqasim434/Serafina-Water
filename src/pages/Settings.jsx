/**
 * Settings Page
 * 
 * Main page for application settings (Admin only)
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import {
  setLoading,
  setSettings,
  setError,
} from '../features/settings/slice.js';
import { settingsService } from '../features/settings/slice.js';
import { setLanguage } from '../features/i18n/slice.js';
import { CategoryManager } from '../features/expenses/components/CategoryManager.jsx';
import { expensesService } from '../features/expenses/slice.js';
import {
  setCategories,
  addCategory,
  updateCategoryInState,
  removeCategory,
} from '../features/expenses/slice.js';

const SETTINGS_SECTIONS = {
  COMPANY: 'company',
  LANGUAGE: 'language',
  CATEGORIES: 'categories',
};

export function Settings() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { settings, isLoading, error } = useSelector((state) => state.settings);
  const { categories } = useSelector((state) => state.expenses);
  const { items: expenses } = useSelector((state) => state.expenses);

  const [activeSection, setActiveSection] = useState(SETTINGS_SECTIONS.COMPANY);
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    defaultLanguage: 'en',
  });

  // Load settings on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const loadedSettings = await settingsService.loadSettings();
        dispatch(setSettings(loadedSettings));
        setFormData({
          companyName: loadedSettings.companyInfo?.name || '',
          companyAddress: loadedSettings.companyInfo?.address || '',
          companyPhone: loadedSettings.companyInfo?.phone || '',
          companyEmail: loadedSettings.companyInfo?.email || '',
          companyWebsite: loadedSettings.companyInfo?.website || '',
          defaultLanguage: loadedSettings.defaultLanguage || 'en',
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

  const handleCreateCategory = async (name, description) => {
    dispatch(setLoading(true));
    try {
      const newCategory = await expensesService.createCategory(name, description, categories);
      dispatch(addCategory(newCategory));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateCategory = async (categoryId, name, description) => {
    dispatch(setLoading(true));
    try {
      const updated = await expensesService.updateCategory(
        categoryId,
        name,
        description,
        categories
      );
      dispatch(updateCategoryInState(updated));
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    dispatch(setLoading(true));
    try {
      await expensesService.deleteCategory(categoryId, categories, expenses);
      dispatch(removeCategory(categoryId));
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
                onClick={() => setActiveSection(SETTINGS_SECTIONS.CATEGORIES)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  activeSection === SETTINGS_SECTIONS.CATEGORIES
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('categories')}
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('save')}
                </button>
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                </select>
              </div>
            </div>
          )}

          {activeSection === SETTINGS_SECTIONS.CATEGORIES && (
            <CategoryManager
              onCreate={handleCreateCategory}
              onUpdate={handleUpdateCategory}
              onDelete={handleDeleteCategory}
            />
          )}
        </div>
      </div>
    </div>
  );
}
