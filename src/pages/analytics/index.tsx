import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import api from '@/lib/api';
import DateRangePicker from '@/components/DateRangePicker';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useThemeStore } from '@/stores/theme.store';

import { SectionAChart } from './components/SectionAChart';
import { SectionBPieChart } from './components/SectionBPieChart';
import { SectionCRevenueChart } from './components/SectionCRevenueChart';
import type {
  Client,
  DailyExpenseRow,
  ExpensesSummary,
  WbReport,
} from './types';
import { defaultDateRange } from './utils/date';
import { formatDateTick } from './utils/format';
import { selectItemsClients } from './utils/select-items';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const resolved = useThemeStore((s) => s.resolved);

  const clientsQuery = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });

  const clients = clientsQuery.data ?? [];

  const clientSelectItems = useMemo(
    () => selectItemsClients(clients),
    [clients],
  );

  const effectiveClientId = selectedClientId || clients[0]?.id || '';

  const wbReportQuery = useQuery<WbReport>({
    queryKey: ['wb-report', effectiveClientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<WbReport>(
        `/wb/report/${effectiveClientId}?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!effectiveClientId,
  });

  const expensesQuery = useQuery<ExpensesSummary>({
    queryKey: ['expenses-summary', effectiveClientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<ExpensesSummary>(
        `/expenses/summary?clientId=${effectiveClientId}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!effectiveClientId,
  });

  const dailyExpensesQuery = useQuery<DailyExpenseRow[]>({
    queryKey: ['expenses-daily', effectiveClientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<DailyExpenseRow[]>(
        `/expenses/daily-totals?clientId=${effectiveClientId}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!effectiveClientId,
  });

  const dailyIncomesQuery = useQuery<DailyExpenseRow[]>({
    queryKey: ['incomes-daily', effectiveClientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<DailyExpenseRow[]>(
        `/incomes/daily-totals?clientId=${effectiveClientId}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!effectiveClientId,
  });

  const composedChartData = useMemo(() => {
    if (!wbReportQuery.data?.daily) return [];
    let cumulative = 0;
    return wbReportQuery.data.daily.map((d) => {
      cumulative += d.income + d.expenses;
      return {
        date: d.date,
        dateLabel: formatDateTick(d.date),
        income: d.income,
        expenses: -Math.abs(d.expenses),
        cumulativeBalance: cumulative,
      };
    });
  }, [wbReportQuery.data]);

  const pieData = useMemo(() => {
    if (!expensesQuery.data?.byCategory) return [];
    const fallback = resolved === 'dark' ? '#a78bfa' : '#7c3aed';
    return expensesQuery.data.byCategory.map((cat) => ({
      category: cat.category_id,
      label: cat.icon_emoji ? `${cat.icon_emoji} ${cat.name}` : cat.name,
      value: cat.total,
      color: cat.color ?? fallback,
    }));
  }, [expensesQuery.data, resolved]);

  const pieTotal = expensesQuery.data?.grandTotal ?? 0;

  const revenueChartData = useMemo(() => {
    if (!wbReportQuery.data?.daily) return [];
    const daily = wbReportQuery.data.daily;
    const extraByDate = new Map<string, number>();
    for (const row of dailyExpensesQuery.data ?? []) {
      extraByDate.set(row.date, row.total);
    }
    const incomesByDate = new Map<string, number>();
    for (const row of dailyIncomesQuery.data ?? []) {
      incomesByDate.set(row.date, row.total);
    }
    return daily.map((d) => {
      const wbRevenue = d.income - Math.abs(d.expenses);
      const extra = extraByDate.get(d.date) ?? 0;
      const extraInc = incomesByDate.get(d.date) ?? 0;
      return {
        date: d.date,
        dateLabel: formatDateTick(d.date),
        wbRevenue,
        realRevenue: wbRevenue - extra + extraInc,
        extraExpenses: extra,
        extraIncomes: extraInc,
      };
    });
  }, [wbReportQuery.data, dailyExpensesQuery.data, dailyIncomesQuery.data]);

  const isWbLoading = wbReportQuery.isLoading;
  const isExpensesLoading =
    expensesQuery.isLoading ||
    dailyExpensesQuery.isLoading ||
    dailyIncomesQuery.isLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          {t('analytics.title')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t('analytics.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
        <Select
          value={effectiveClientId}
          onValueChange={(v) => setSelectedClientId(v as string)}
          items={clientSelectItems}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder={t('analytics.selectPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <SectionAChart
        data={composedChartData}
        breakdown={wbReportQuery.data?.breakdown ?? null}
        isLoading={isWbLoading}
      />
      <SectionBPieChart data={pieData} total={pieTotal} isLoading={isExpensesLoading} />
      <SectionCRevenueChart data={revenueChartData} isLoading={isWbLoading || isExpensesLoading} />
    </div>
  );
}
