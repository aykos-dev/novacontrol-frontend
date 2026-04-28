import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format, subWeeks } from 'date-fns';
import {
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  Receipt,
  RefreshCw,
} from 'lucide-react';

import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { getChartPalette } from '@/lib/chart-colors';
import { useThemeStore } from '@/stores/theme.store';
import DateRangePicker from '@/components/DateRangePicker';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  currency: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_balance_sync_at: string | null;
  balance_alert_threshold: number | null;
}

interface WbReport {
  daily: {
    date: string;
    income: number;
    expenses: number;
    balance_change: number;
  }[];
  totals: {
    income: number;
    expenses: number;
    retail_sales: number;
    balance_change: number;
  };
  breakdown: {
    retail_sales: number;
    ppvz_reward: number;
    delivery_rub: number;
    storage_fee: number;
    penalty: number;
    deduction: number;
    acceptance: number;
    rebill_logistic_cost: number;
  };
}

interface Balance {
  id: string;
  current: number;
  for_withdraw: number;
  currency: string;
  snapshot_at: string;
}

interface ExpensesSummary {
  byCategory: {
    category_id: string;
    slug: string;
    name: string;
    color: string | null;
    icon_emoji: string | null;
    total: number;
    currency: string;
  }[];
  grandTotal: number;
}

interface IncomesSummary {
  grandTotal: number;
}

/** WB row aggregates mix with extra entries in KGS */
const MIXED_KGS = 'KGS';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BREAKDOWN_ITEMS: { label: string; key: keyof WbReport['breakdown'] }[] = [
  { label: 'Комиссия WB', key: 'ppvz_reward' },
  { label: 'Логистика', key: 'delivery_rub' },
  { label: 'Хранение', key: 'storage_fee' },
  { label: 'Штрафы', key: 'penalty' },
  { label: 'Удержания', key: 'deduction' },
  { label: 'Приемка', key: 'acceptance' },
  { label: 'Корректировка ВВ', key: 'rebill_logistic_cost' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultDateRange() {
  const to = new Date();
  const from = subWeeks(to, 4);
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

function fmtNumber(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  const c = currency?.toUpperCase();
  if (c === 'USD') return `${sign}$${formatted}`;
  if (c === 'KGS') return `${sign}${formatted} KGS`;
  const symbol = '\u20BD';
  return `${sign}${formatted} ${symbol}`;
}

function fmtThousands(value: number): string {
  return `${(value / 1000).toFixed(0)}k`;
}

function formatDateTick(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd.MM');
  } catch {
    return dateStr;
  }
}

function formatTimestamp(value: string | null): string {
  if (!value) return 'Никогда';
  try {
    return format(new Date(value), 'dd.MM.yyyy HH:mm');
  } catch {
    return 'Никогда';
  }
}

// ---------------------------------------------------------------------------
// WB chart: third series «Изменение баланса» — hidden until we revisit WB parity.
// ---------------------------------------------------------------------------

const SHOW_WB_BALANCE_CHANGE_BAR = false;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClientDetailPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const resolved = useThemeStore((s) => s.resolved);
  const palette = getChartPalette(resolved);

  // ---- Client info ----
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

  const client = clientQuery.data;

  // ---- WB Report ----
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

  // ---- Balance ----
  const balanceQuery = useQuery<Balance | null>({
    queryKey: ['wb-balance', clientId],
    queryFn: async () => {
      const { data } = await api.get<Balance | null>(`/wb/balance/${clientId}`);
      if (!data) return null;
      return {
        ...data,
        current: Number(data.current),
        for_withdraw: Number(data.for_withdraw),
      };
    },
    enabled: !!clientId,
  });

  // ---- Expenses ----
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

  // ---- Derived ----
  const wbIncome = wbReportQuery.data?.totals.income ?? 0;
  const wbExpenses = wbReportQuery.data?.totals.expenses ?? 0;
  const extraExpenses = expensesQuery.data?.grandTotal ?? 0;
  const extraIncomes = incomesQuery.data?.grandTotal ?? 0;
  const revenue = wbIncome - wbExpenses;
  const realRevenue = revenue - extraExpenses + extraIncomes;

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
    balanceQuery.isLoading ||
    expensesQuery.isLoading ||
    incomesQuery.isLoading;

  const breakdown = wbReportQuery.data?.breakdown ?? null;
  const balance = balanceQuery.data;

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-muted">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-28" />
                </CardContent>
              </Card>
            ))
          : (
              [
                {
                  label: 'Приход WB',
                  value: wbIncome,
                  icon: TrendingUp,
                  border: 'border-l-emerald-500',
                  iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
                  iconColor: 'text-emerald-600 dark:text-emerald-400',
                },
                {
                  label: 'Расходы WB',
                  value: wbExpenses,
                  icon: TrendingDown,
                  border: 'border-l-[var(--wb-violet)]',
                  iconBg: 'bg-[var(--wb-violet)]/15 dark:bg-[var(--wb-violet)]/25',
                  iconColor: 'text-[var(--wb-violet)]',
                },
                {
                  label: 'Прибыль WB (розница − сборы)',
                  value: revenue,
                  icon: DollarSign,
                  border: 'border-l-chart-5',
                  iconBg: 'bg-chart-5/15 dark:bg-chart-5/25',
                  iconColor: 'text-chart-5',
                },
                {
                  label: 'Доп. расходы (KGS)',
                  value: extraExpenses,
                  icon: Receipt,
                  border: 'border-l-orange-600',
                  iconBg: 'bg-orange-600/15 dark:bg-orange-600/25',
                  iconColor: 'text-orange-600 dark:text-orange-400',
                },
                {
                  label: 'Чистая прибыль',
                  value: realRevenue,
                  icon: Calculator,
                  border: 'border-l-chart-3',
                  iconBg: 'bg-chart-3/15 dark:bg-chart-3/25',
                  iconColor: 'text-chart-3',
                },
              ] as const
            ).map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className={`border-l-4 ${card.border}`}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </CardTitle>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${card.iconBg}`}
                    >
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tracking-tight tabular-nums">
                      {fmtCurrency(card.value, MIXED_KGS)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Balance card */}
      {balance && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="size-4 text-muted-foreground" />
                Баланс
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Текущий</p>
                  <p className="text-2xl font-bold tabular-nums">
                    {fmtCurrency(balance.current, balance.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">К выводу</p>
                  <p className="text-xl font-semibold tabular-nums text-muted-foreground">
                    {fmtCurrency(balance.for_withdraw, balance.currency)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Обновлено: {formatTimestamp(balance.snapshot_at)}
              </p>
            </CardContent>
          </Card> */}

          {/* Balance history sparkline */}
          {/* <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Динамика баланса (30 дней)</CardTitle>
            </CardHeader>
            <CardContent>
              {balanceHistoryQuery.isLoading ? (
                <Skeleton className="h-[120px] w-full" />
              ) : (balanceHistoryQuery.data?.length ?? 0) === 0 ? (
                <div className="flex h-[120px] items-center justify-center text-sm text-muted-foreground">
                  Нет данных
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={balanceHistoryQuery.data}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const p = payload[0].payload as BalanceHistoryPoint;
                        return (
                          <div className="rounded-lg border bg-background px-3 py-1.5 shadow-md">
                            <p className="text-xs text-muted-foreground">{p.date}</p>
                            <p className="text-sm font-semibold tabular-nums">
                              {fmtCurrency(p.current, currency)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke={palette.wbRevenueLine}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card> */}
        </div>
      )}

      {/* Income/Expense chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clientDetail.chartTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {wbReportQuery.isLoading ? (
            <ChartSkeleton />
          ) : composedData.length === 0 ? (
            <EmptyChart message={t('clientDetail.emptyChart')} />
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="min-w-0 flex-1">
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={composedData}>
                    <CartesianGrid stroke={palette.gridStroke} strokeDasharray="3 3" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis
                      tickFormatter={fmtThousands}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 12 }} />
                    <ReferenceLine y={0} stroke={palette.referenceLine} strokeDasharray="3 3" />
                    <Bar
                      dataKey="income"
                      name={t('clientDetail.chartIncome')}
                      fill={palette.incomeBar}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={SHOW_WB_BALANCE_CHANGE_BAR ? 26 : 32}
                    />
                    <Bar
                      dataKey="expenses"
                      name={t('clientDetail.chartExpense')}
                      fill={palette.expenseBar}
                      radius={[0, 0, 4, 4]}
                      maxBarSize={SHOW_WB_BALANCE_CHANGE_BAR ? 26 : 32}
                    />
                    {SHOW_WB_BALANCE_CHANGE_BAR ? (
                      <Bar
                        dataKey="balanceChange"
                        name={t('clientDetail.chartBalanceChange')}
                        fill={palette.balanceChangeBar}
                        radius={[4, 4, 4, 4]}
                        maxBarSize={26}
                      />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown sidebar */}
              {breakdown && (
                <div className="shrink-0 space-y-3 lg:w-60">
                  <h3 className="text-sm font-semibold text-muted-foreground">Разбивка</h3>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', palette.retailDot)} />
                      <span className="text-sm">Продажи</span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {fmtNumber(breakdown.retail_sales)}
                    </span>
                  </div>
                  {BREAKDOWN_ITEMS.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn('h-2.5 w-2.5 rounded-full', palette.breakdownDot)} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {fmtNumber(breakdown[item.key])}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extra expenses pie chart */}
      {pieData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Дополнительные расходы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                    cx="50%"
                    cy="45%"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const e = payload[0];
                      const pct =
                        extraExpenses > 0
                          ? (((e.value as number) / extraExpenses) * 100).toFixed(1)
                          : '0';
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-md">
                          <p className="text-xs font-semibold">{e.name}</p>
                          <p className="text-xs tabular-nums">
                            {fmtNumber(e.value as number)} ({pct}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                  <text
                    x="50%"
                    y="43%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-sm font-semibold"
                  >
                    {fmtNumber(extraExpenses)}
                  </text>
                  <text
                    x="50%"
                    y="49%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    Итого
                  </text>
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2">
                {pieData.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.label}: {fmtNumber(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small helper components
// ---------------------------------------------------------------------------

function ChartSkeleton() {
  return (
    <div className="relative h-[380px] overflow-hidden rounded-lg bg-muted">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted" />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-[380px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <RefreshCw className="size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="max-w-sm text-xs">{t('clientDetail.emptyChartHint')}</p>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-xs font-semibold tabular-nums">{fmtNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}
