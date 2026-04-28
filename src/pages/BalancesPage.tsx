import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Wallet } from 'lucide-react';
import api from '@/lib/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  currency: string;
}

interface Balance {
  id: string;
  client_id: string;
  current: number;
  for_withdraw: number;
  currency: string;
  snapshot_at: string;
}

interface BalanceHistoryPoint {
  date: string;
  current: number;
}

interface AlertConfig {
  clientId: string;
  clientName: string;
  threshold: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const cur = currency?.toUpperCase() ?? 'RUB';
  if (cur === 'USD') {
    return `${amount < 0 ? '−' : ''}${formatted} $`;
  }
  return `${amount < 0 ? '−' : ''}${formatted} KGS`;
}

function thresholdBorderClass(
  balance: number,
  threshold: number | undefined,
): string {
  if (threshold === undefined) return 'border-l-emerald-500';
  if (balance < threshold) return 'border-l-red-500';
  if (balance < threshold * 1.2) return 'border-l-amber-500';
  return 'border-l-emerald-500';
}

/** Sparkline stroke: зелёный при росте баланса за период, красный при падении. */
function trendLineColor(values: number[]): string {
  if (values.length < 2) return '#9ca3af';
  const first = values[0]!;
  const last = values[values.length - 1]!;
  if (last > first) return '#10b981';
  if (last < first) return '#ef4444';
  return '#9ca3af';
}

function toSparklineChartData(
  history: BalanceHistoryPoint[],
  fallbackBalance: number,
): { idx: number; value: number }[] {
  const raw = history.map((p, i) => ({ idx: i, value: p.current }));
  if (raw.length >= 2) return raw;
  if (raw.length === 1) {
    return [
      { idx: 0, value: raw[0]!.value },
      { idx: 1, value: raw[0]!.value },
    ];
  }
  return [
    { idx: 0, value: fallbackBalance },
    { idx: 1, value: fallbackBalance },
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BalancesPage() {
  const clientsQuery = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });

  const alertsQuery = useQuery<AlertConfig[]>({
    queryKey: ['alerts-config'],
    queryFn: async () => {
      const { data } = await api.get('/alerts/config');
      return data;
    },
  });

  const clients = clientsQuery.data ?? [];

  const balanceQueries = useQuery<Record<string, Balance | null>>({
    queryKey: ['balances', clients.map((c) => c.id)],
    queryFn: async () => {
      const entries = await Promise.all(
        clients.map(async (client) => {
          try {
            const { data } = await api.get<Balance | null>(
              `/wb/balance/${client.id}`,
            );
            return [client.id, data] as const;
          } catch {
            return [client.id, null] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: clients.length > 0,
  });

  const historyQueries = useQuery<Record<string, BalanceHistoryPoint[]>>({
    queryKey: ['balance-histories', clients.map((c) => c.id).join(',')],
    queryFn: async () => {
      const entries = await Promise.all(
        clients.map(async (client) => {
          try {
            const { data } = await api.get<BalanceHistoryPoint[]>(
              `/wb/balance/${client.id}/history?days=7`,
            );
            return [client.id, data ?? []] as const;
          } catch {
            return [client.id, []] as const;
          }
        }),
      );
      return Object.fromEntries(entries);
    },
    enabled: clients.length > 0,
  });

  const thresholdMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of alertsQuery.data ?? []) {
      if (a.threshold != null) map.set(a.clientId, a.threshold);
    }
    return map;
  }, [alertsQuery.data]);

  const isLoading =
    clientsQuery.isLoading ||
    alertsQuery.isLoading ||
    balanceQueries.isLoading ||
    historyQueries.isLoading;

  const balances = balanceQueries.data ?? {};
  const histories = historyQueries.data ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Балансы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Текущий баланс WB и сумма к выводу по каждому клиенту (данные из
          последней синхронизации).
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-3 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wallet className="mb-3 size-10 text-muted-foreground/50" />
            <p className="text-muted-foreground">Нет клиентов</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const balance = balances[client.id];
            const history = histories[client.id] ?? [];
            const threshold = thresholdMap.get(client.id);
            const currentBalance = balance?.current ?? 0;
            const borderClass = thresholdBorderClass(currentBalance, threshold);
            const sparkData = toSparklineChartData(
              history,
              currentBalance,
            );
            const trendColor = trendLineColor(sparkData.map((d) => d.value));

            return (
              <Card
                key={client.id}
                className={`border-l-4 ${borderClass}`}
              >
                <CardHeader>
                  <CardTitle className="truncate">{client.name}</CardTitle>
                  {balance ? (
                    <CardDescription>
                      К выводу:{' '}
                      {formatCurrency(
                        balance.for_withdraw,
                        balance.currency ?? client.currency,
                      )}
                    </CardDescription>
                  ) : (
                    <CardDescription>Нет снимка баланса</CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {balance ? (
                    <>
                      <p className="text-2xl font-bold tracking-tight">
                        {formatCurrency(
                          balance.current,
                          balance.currency ?? client.currency,
                        )}
                      </p>

                      {threshold !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Порог оповещения:{' '}
                          <span className="font-medium text-foreground">
                            {formatCurrency(threshold, client.currency)}
                          </span>
                        </p>
                      )}

                      <div className="h-10 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={sparkData}>
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={trendColor}
                              strokeWidth={1.5}
                              dot={false}
                              isAnimationActive
                              animationDuration={600}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Тренд за 7 дней по дневным снимкам баланса
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Нет данных о балансе. Запустите проверку баланса или
                      синхронизацию.
                    </p>
                  )}
                </CardContent>

                {balance?.snapshot_at && (
                  <CardFooter>
                    <span className="text-xs text-muted-foreground">
                      Обновлено{' '}
                      {formatDistanceToNow(new Date(balance.snapshot_at), {
                        addSuffix: true,
                        locale: ru,
                      })}
                    </span>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
