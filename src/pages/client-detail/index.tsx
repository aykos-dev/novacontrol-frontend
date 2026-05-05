import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import api from '@/lib/api';
import { getChartPalette } from '@/lib/chart-colors';
import { useThemeStore } from '@/stores/theme.store';
import DateRangePicker from '@/components/DateRangePicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { ExtraExpensesPie } from './components/ExtraExpensesPie';
import { SummaryCards } from './components/SummaryCards';
import { WbReportChart } from './components/WbReportChart';
import type { Client, ExpensesSummary, IncomesSummary, WbReport } from './types';
import { defaultDateRange, formatTimestamp } from './utils/date';
import { formatDateTick } from './utils/format';

export default function ClientDetailPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const resolved = useThemeStore((s) => s.resolved);
  const palette = getChartPalette(resolved);

  const clientQuery = useQuery<Client>({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${clientId}`);
      return {
        ...data,
        balance_alert_threshold:
          data.balance_alert_threshold != null
            ? Number(data.balance_alert_threshold)
            : null,
      };
    },
    enabled: !!clientId,
  });

  const wbReportQuery = useQuery<WbReport>({
    queryKey: ['wb-report', clientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<WbReport>(
        `/wb/report/${clientId}?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!clientId,
  });

  const expensesQuery = useQuery<ExpensesSummary>({
    queryKey: ['expenses-summary', clientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<ExpensesSummary>(
        `/expenses/summary?clientId=${clientId}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!clientId,
  });

  const incomesQuery = useQuery<IncomesSummary>({
    queryKey: ['incomes-summary', clientId, dateRange],
    queryFn: async () => {
      const { data } = await api.get<IncomesSummary>(
        `/incomes/summary?clientId=${clientId}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
      );
      return data;
    },
    enabled: !!clientId,
  });

  const client = clientQuery.data;
  const wbIncome = wbReportQuery.data?.totals.income ?? 0;
  const wbExpenses = wbReportQuery.data?.totals.expenses ?? 0;
  const extraExpenses = expensesQuery.data?.grandTotal ?? 0;
  const extraIncomes = incomesQuery.data?.grandTotal ?? 0;
  const revenue = wbIncome - wbExpenses;
  const realRevenue = revenue - extraExpenses;
  const extraBalance = extraIncomes - extraExpenses;

  const composedData = useMemo(() => {
    if (!wbReportQuery.data?.daily) return [];
    let cumulative = 0;
    return wbReportQuery.data.daily.map((d) => {
      cumulative += d.income + d.expenses;
      return {
        date: d.date,
        dateLabel: formatDateTick(d.date),
        income: d.income,
        expenses: -Math.abs(d.expenses),
        balanceChange: d.balance_change,
        cumulativeBalance: cumulative,
      };
    });
  }, [wbReportQuery.data]);

  const pieData = useMemo(() => {
    if (!expensesQuery.data?.byCategory) return [];
    const fallback = resolved === 'dark' ? '#a78bfa' : '#7c3aed';
    return expensesQuery.data.byCategory.map((cat) => ({
      id: cat.category_id,
      label: cat.icon_emoji ? `${cat.icon_emoji} ${cat.name}` : cat.name,
      value: cat.total,
      color: cat.color ?? fallback,
    }));
  }, [expensesQuery.data, resolved]);

  const isLoading =
    clientQuery.isLoading ||
    wbReportQuery.isLoading ||
    expensesQuery.isLoading ||
    incomesQuery.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link to="/clients">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {client?.name ?? <Skeleton className="inline-block h-7 w-32" />}
              </h1>
              {client && (
                <Badge
                  className={
                    client.is_active
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : undefined
                  }
                  variant={client.is_active ? 'default' : 'secondary'}
                >
                  {client.is_active ? 'Active' : 'Inactive'}
                </Badge>
              )}
            </div>
            {client && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Последняя синхронизация: {formatTimestamp(client.last_sync_at)}
              </p>
            )}
          </div>
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <SummaryCards
        isLoading={isLoading}
        wbIncome={wbIncome}
        wbExpenses={wbExpenses}
        revenue={revenue}
        extraExpenses={extraExpenses}
        extraIncomes={extraIncomes}
        realRevenue={realRevenue}
        extraBalance={extraBalance}
      />

      <WbReportChart
        data={composedData}
        breakdown={wbReportQuery.data?.breakdown ?? null}
        isLoading={wbReportQuery.isLoading}
        palette={palette}
      />

      <ExtraExpensesPie data={pieData} total={extraExpenses} />
    </div>
  );
}
