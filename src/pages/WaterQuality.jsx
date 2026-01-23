/**
 * Water Quality Page
 * 
 * Main page for daily water quality monitoring
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import {
  setLoading,
  setEntries,
  addEntry,
  setRanges,
  setError,
} from '../features/waterQuality/slice.js';
import { waterQualityService } from '../features/waterQuality/slice.js';
import { WaterQualityForm } from '../features/waterQuality/components/WaterQualityForm.jsx';
import { WaterQualityList } from '../features/waterQuality/components/WaterQualityList.jsx';
import { getCurrentAuthUser } from '../features/auth/service.js';

const VIEW_MODES = {
  LIST: 'list',
  ADD: 'add',
};

export function WaterQuality() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { items: entries, ranges, isLoading, error } = useSelector(
    (state) => state.waterQuality
  );

  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST);

  // Load entries and ranges on mount
  useEffect(() => {
    async function loadData() {
      dispatch(setLoading(true));
      try {
        const [loadedEntries, loadedRanges] = await Promise.all([
          waterQualityService.loadWaterQualityEntries(),
          waterQualityService.loadWaterQualityRanges(),
        ]);
        dispatch(setEntries(loadedEntries));
        dispatch(setRanges(loadedRanges));
      } catch (err) {
        dispatch(setError(err.message));
      } finally {
        dispatch(setLoading(false));
      }
    }

    loadData();
  }, [dispatch]);

  const handleAdd = () => {
    setViewMode(VIEW_MODES.ADD);
  };

  const handleCancel = () => {
    setViewMode(VIEW_MODES.LIST);
  };

  const handleSubmit = async (date, time, pH, tds, chlorine) => {
    dispatch(setLoading(true));
    try {
      const user = await getCurrentAuthUser();
      const newEntry = await waterQualityService.createWaterQualityEntry(
        { date, time, pH, tds, chlorine },
        entries,
        ranges,
        user?.id
      );
      dispatch(addEntry(newEntry));
      setViewMode(VIEW_MODES.LIST);
      alert(t('waterQualityEntrySaved'));
    } catch (err) {
      dispatch(setError(err.message));
      alert(err.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (isLoading && entries.length === 0) {
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('waterQuality')}</h1>
        {viewMode === VIEW_MODES.LIST && (
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {t('addEntry')}
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {viewMode === VIEW_MODES.ADD && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('addWaterQualityEntry')}</h2>
          <WaterQualityForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      )}

      {viewMode === VIEW_MODES.LIST && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('waterQualityHistory')}</h2>
          <WaterQualityList />
        </div>
      )}
    </div>
  );
}
