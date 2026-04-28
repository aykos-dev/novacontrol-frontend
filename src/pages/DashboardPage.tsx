import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subWeeks } from 'date-fns';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
  Calculator,
} from 'lucide-react';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import DateRangePicker from '@/components/DateRangePicker';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  currency: string;
  is_active: boolean;
  last_sync_at: string;
}

interface WbReportTotals {
  income: number;
  expenses: number;
  retail_sales: number;
}

interface WbReport {
  daily: { date: string; income: number; expenses: number }[];
  totals: WbReportTotals;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const symbol = currency?.toUpperCase() === 'USD' ? '$' : 'KGS';

  if (currency?.toUpperCase() === 'USD') {
    return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
  }
  return `${amount < 0 ? '-' : ''}${formatted} ${symbol}`;
}

function defaultDateRange() {
  const to = new Date();
  const from = subWeeks(to, 4);
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}

const ALL_CLIENTS = '__all__';

// ---------------------------------------------------------------------------
// Breakdown labels
// ---------------------------------------------------------------------------

const breakdownItems: { label: string; key: keyof WbReport['breakdown'] }[] = [
  { label: 'PPVZ Reward', key: 'ppvz_reward' },
  { label: 'Delivery', key: 'delivery_rub' },
  { label: 'Storage Fee', key: 'storage_fee' },
  { label: 'Penalty', key: 'penalty' },
  { label: 'Deduction', key: 'deduction' },
  { label: 'Acceptance', key: 'acceptance' },
  { label: 'Rebill Logistics', key: 'rebill_logistic_cost' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [selectedClientId, setSelectedClientId] = useState<string>(ALL_CLIENTS);

  // ---- Queries ----

  const clientsQuery = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });

  const activeClients = useMemo(
    () => (clientsQuery.data ?? []).filter((c) => c.is_active),
    [clientsQuery.data],
  );

  const selectedClient = useMemo(
    () => activeClients.find((c) => c.id === selectedClientId) ?? null,
    [activeClients, selectedClientId],
  );

  const clientIdsToFetch = useMemo(
    () =>
      selectedClientId === ALL_CLIENTS
        ? activeClients.map((c) => c.id)
        : [selectedClientId],
    [selectedClientId, activeClients],
  );

  // Base UI Select: `items` maps values to trigger labels (otherwise UUIDs show).
  const clientSelectItems = useMemo(
    () => [
      { value: ALL_CLIENTS, label: 'All Clients' },
      ...activeClients.map((c) => ({ value: c.id, label: c.name })),
    ],
    [activeClients],
  );

  // Fetch WB reports — one per client, then aggregate if "All Clients"
  const wbReportQuery = useQuery<WbReport | null>({
    queryKey: ['wb-report', clientIdsToFetch, dateRange],
    queryFn: async () => {
      if (clientIdsToFetch.length === 0) return null;

      const reports = await Promise.all(
        clientIdsToFetch.map(async (id) => {
          const { data } = await api.get<WbReport>(
            `/wb/report/${id}?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
          );
          return data;
        }),
      );

      if (reports.length === 1) return reports[0];

      const combined: WbReport = {
        daily: [],
        totals: { income: 0, expenses: 0, retail_sales: 0 },
        breakdown: {
          retail_sales: 0,
          ppvz_reward: 0,
          delivery_rub: 0,
          storage_fee: 0,
          penalty: 0,
          deduction: 0,
          acceptance: 0,
          rebill_logistic_cost: 0,
        },
      };

      for (const r of reports) {
        combined.totals.income += r.totals.income;
        combined.totals.expenses += r.totals.expenses;
        combined.totals.retail_sales += r.totals.retail_sales ?? 0;
        for (const key of Object.keys(combined.breakdown) as (keyof WbReport['breakdown'])[]) {
          combined.breakdown[key] += r.breakdown[key] ?? 0;
        }
      }

      return combined;
    },
    enabled: clientIdsToFetch.length > 0,
  });

  // Fetch expenses summary
  const expensesQuery = useQuery<ExpensesSummary | null>({
    queryKey: ['expenses-summary', clientIdsToFetch, dateRange],
    queryFn: async () => {
      if (clientIdsToFetch.length === 0) return null;

      const summaries = await Promise.all(
        clientIdsToFetch.map(async (id) => {
          const { data } = await api.get<ExpensesSummary>(
            `/expenses/summary?clientId=${id}&dateFrom=${dateRange.from}&dateTo=${dateRange.to}`,
          );
          return data;
        }),
      );

      if (summaries.length === 1) return summaries[0];

      return {
        byCategory: [],
        grandTotal: summaries.reduce((sum, s) => sum + s.grandTotal, 0),
      } satisfies ExpensesSummary;
    },
    enabled: clientIdsToFetch.length > 0,
  });

  // ---- Derived values ----

  const currency = selectedClient?.currency ?? 'RUB';
  const wbIncome = wbReportQuery.data?.totals.income ?? 0;
  const wbExpenses = wbReportQuery.data?.totals.expenses ?? 0;
  const extraExpenses = expensesQuery.data?.grandTotal ?? 0;
  const revenue = wbIncome - wbExpenses;
  const realRevenue = revenue - extraExpenses;

  const isLoading =
    clientsQuery.isLoading ||
    wbReportQuery.isLoading ||
    expensesQuery.isLoading;

  // ---- Summary card definitions ----

  const summaryCards = [
    {
      label: 'WB Income',
      value: wbIncome,
      icon: TrendingUp,
      borderColor: 'border-l-primary',
      iconColor: 'text-primary',
      bgAccent: 'bg-primary/15 dark:bg-primary/25',
    },
    {
      label: 'WB Expenses',
      value: wbExpenses,
      icon: TrendingDown,
      borderColor: 'border-l-[var(--wb-violet)]',
      iconColor: 'text-[var(--wb-violet)]',
      bgAccent: 'bg-[var(--wb-violet)]/15 dark:bg-[var(--wb-violet)]/25',
    },
    {
      label: 'Revenue',
      value: revenue,
      icon: DollarSign,
      borderColor: 'border-l-chart-5',
      iconColor: 'text-chart-5',
      bgAccent: 'bg-chart-5/15 dark:bg-chart-5/25',
    },
    {
      label: 'Extra Expenses',
      value: extraExpenses,
      icon: Receipt,
      borderColor: 'border-l-chart-4',
      iconColor: 'text-chart-4',
      bgAccent: 'bg-chart-4/15 dark:bg-chart-4/25',
    },
    {
      label: 'Real Revenue',
      value: realRevenue,
      icon: Calculator,
      borderColor: 'border-l-chart-3',
      iconColor: 'text-chart-3',
      bgAccent: 'bg-chart-3/15 dark:bg-chart-3/25',
    },
  ];

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Overview of income, expenses, and revenue across your clients.
        </p>
      </div>

      {/* Controls row: date range + client selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker value={dateRange} onChange={setDateRange} />

        <Select
          value={selectedClientId}
          onValueChange={(v) => v != null && setSelectedClientId(v)}
          items={clientSelectItems}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Select client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CLIENTS}>All Clients</SelectItem>
            {activeClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-muted">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))
          : summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.label}
                  className={`border-l-4 ${card.borderColor}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </CardTitle>
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${card.bgAccent}`}
                    >
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold tracking-tight">
                      {formatCurrency(card.value, currency)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* WB Expense Breakdown */}
      {!isLoading && wbReportQuery.data && (
        <Card>
          <CardHeader>
            <CardTitle>WB Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {breakdownItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      wbReportQuery.data!.breakdown[item.key],
                      currency,
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extra Expenses by Category */}
      {!isLoading &&
        expensesQuery.data &&
        expensesQuery.data.byCategory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Extra Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {expensesQuery.data.byCategory.map((cat) => (
                  <div
                    key={cat.category_id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm text-muted-foreground">
                      {cat.icon_emoji ? `${cat.icon_emoji} ${cat.name}` : cat.name}
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(cat.total, cat.currency ?? currency)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
