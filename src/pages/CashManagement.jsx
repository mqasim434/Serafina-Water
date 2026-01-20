/**
 * Cash Management Page
 * 
 * Main page for cash management with real-time balance and summaries
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from '../shared/hooks/useTranslation.js';
import { CashSummary } from '../features/cash/components/CashSummary.jsx';
import { DailyCashCard } from '../features/cash/components/DailyCashCard.jsx';
import { WeeklySummaryCard } from '../features/cash/components/WeeklySummaryCard.jsx';
import { MonthlySummaryCard } from '../features/cash/components/MonthlySummaryCard.jsx';
import * as cashService from '../features/cash/service.js';

export function CashManagement() {
  const { t } = useTranslation();
  const { items: orders } = useSelector((state) => state.orders);
  const { items: payments } = useSelector((state) => state.payments);

  const [currentBalance, setCurrentBalance] = useState(0);

  // Load current balance on mount
  useEffect(() => {
    async function loadBalance() {
      const balance = await cashService.loadCurrentBalance();
      setCurrentBalance(balance);
    }
    loadBalance();
  }, []);

  // Calculate real-time cash
  const realTimeCash = cashService.calculateRealTimeCash(orders, payments, currentBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('cashManagement')}</h1>
      </div>

      {/* Real-time Cash Summary */}
      <CashSummary />

      {/* Summaries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DailyCashCard />
        <WeeklySummaryCard />
        <MonthlySummaryCard />
      </div>
    </div>
  );
}
