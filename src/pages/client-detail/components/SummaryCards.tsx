import {
  Calculator,
  DollarSign,
  Receipt,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { MIXED_KGS } from '../constants';
import { fmtCurrency } from '../utils/format';

interface SummaryCardsProps {
  isLoading: boolean;
  wbIncome: number;
  wbExpenses: number;
  revenue: number;
  extraExpenses: number;
  extraIncomes: number;
  realRevenue: number;
  extraBalance: number;
}

export function SummaryCards({
  isLoading,
  wbIncome,
  wbExpenses,
  revenue,
  extraExpenses,
  extraIncomes,
  realRevenue,
  extraBalance,
}: SummaryCardsProps) {
  const cards = [
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
      label: 'Выручка (розница − сборы)',
      value: revenue,
      icon: DollarSign,
      border: 'border-l-chart-5',
      iconBg: 'bg-chart-5/15 dark:bg-chart-5/25',
      iconColor: 'text-chart-5',
    },
    {
      label: 'Чистая выручка',
      value: realRevenue,
      icon: Calculator,
      border: 'border-l-chart-3',
      iconBg: 'bg-chart-3/15 dark:bg-chart-3/25',
      iconColor: 'text-chart-3',
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
      label: 'Доп. пополнения (KGS)',
      value: extraIncomes,
      icon: WalletCards,
      border: 'border-l-emerald-500',
      iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Баланс доп. средств',
      value: extraBalance,
      icon: DollarSign,
      border: extraBalance <= 0 ? 'border-l-destructive' : 'border-l-cyan-500',
      iconBg:
        extraBalance <= 0
          ? 'bg-destructive/15 dark:bg-destructive/25'
          : 'bg-cyan-500/15 dark:bg-cyan-500/25',
      iconColor:
        extraBalance <= 0
          ? 'text-destructive'
          : 'text-cyan-600 dark:text-cyan-400',
    },
  ] as const;

  return (
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
        : cards.map((card) => {
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
  );
}
