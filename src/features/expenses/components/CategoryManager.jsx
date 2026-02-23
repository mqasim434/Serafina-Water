/**
 * Category Manager Component
 * 
 * Manages expense categories (add, edit, delete)
 */

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../../shared/hooks/useTranslation.js';
import { LoadingButton } from '../../../shared/components/LoadingButton.jsx';

/**
 * Category Manager props
 * @typedef {Object} CategoryManagerProps
 * @property {function(string, string): Promise<void>} onCreate - Create handler
 * @property {function(string, string, string): Promise<void>} onUpdate - Update handler
 * @property {function(string): Promise<void>} onDelete - Delete handler
 */

/**
 * Category Manager component
 * @param {CategoryManagerProps} props
 */
export function CategoryManager({ onCreate, onUpdate, onDelete }) {
  const { t } = useTranslation();
  const { categories } = useSelector((state) => state.expenses);
  const { items: expenses } = useSelector((state) => state.expenses);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleAdd = () => {
    setFormData({ name: '', description: '' });
    setShowAddForm(true);
    setEditingId(null);
  };

  const handleEdit = (category) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingId(category.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate(editingId, formData.name, formData.description);
      } else {
        await onCreate(formData.name, formData.description);
      }
      handleCancel();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('deleteCategory') + '?')) {
      return;
    }
    setDeletingId(categoryId);
    try {
      await onDelete(categoryId);
    } catch (error) {
      alert(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const isCategoryInUse = (categoryId) => {
    return expenses.some((e) => e.category === categoryId);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">{t('categories')}</h2>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          {t('addCategory')}
        </button>
      </div>

      {showAddForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
                {t('categoryName')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="categoryName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label
                htmlFor="categoryDescription"
                className="block text-sm font-medium text-gray-700"
              >
                {t('categoryDescription')}
              </label>
              <textarea
                id="categoryDescription"
                rows={2}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div className="flex justify-end gap-3">
              <LoadingButton type="button" variant="secondary" size="sm" onClick={handleCancel} disabled={isSubmitting}>
                {t('cancel')}
              </LoadingButton>
              <LoadingButton type="submit" size="sm" isLoading={isSubmitting}>
                {editingId ? t('save') : t('addCategory')}
              </LoadingButton>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t('noCategories')}</div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    {t('edit')}
                  </button>
                  {!isCategoryInUse(category.id) && (
                    <LoadingButton
                      type="button"
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(category.id)}
                      isLoading={deletingId === category.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {t('delete')}
                    </LoadingButton>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
