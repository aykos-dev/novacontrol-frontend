import { useTranslation } from 'react-i18next';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { getChartPalette } from '@/lib/chart-colors';

import { BREAKDOWN_ITEMS, SHOW_WB_BALANCE_CHANGE_BAR } from '../constants';
import type { ComposedChartEntry, WbReport } from '../types';
import { fmtNumber, fmtThousands } from '../utils/format';

type Palette = ReturnType<typeof getChartPalette>;

interface WbReportChartProps {
  data: ComposedChartEntry[];
  breakdown: WbReport['breakdown'] | null;
  isLoading: boolean;
  palette: Palette;
}

export function WbReportChart({
  data,
  breakdown,
  isLoading,
  palette,
}: WbReportChartProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('clientDetail.chartTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartSkeleton />
        ) : data.length === 0 ? (
          <EmptyChart message={t('clientDetail.emptyChart')} />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1">
              <ResponsiveContainer width="100%" height={380}>
                <ComposedChart data={data}>
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
                  <ReferenceLine
                    y={0}
                    stroke={palette.referenceLine}
                    strokeDasharray="3 3"
                  />
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
                    radius={[4, 4, 0, 0]}
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

            {breakdown && <BreakdownSidebar breakdown={breakdown} palette={palette} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BreakdownSidebar({
  breakdown,
  palette,
}: {
  breakdown: WbReport['breakdown'];
  palette: Palette;
}) {
  return (
    <div className="shrink-0 space-y-3 lg:w-60">
      <h3 className="text-sm font-semibold text-muted-foreground">Распределение</h3>
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
  );
}

function ChartSkeleton() {
  return (
    <div className="relative h-95 overflow-hidden rounded-lg bg-muted">
      <div className="absolute inset-0 animate-pulse bg-linear-to-r from-muted via-muted-foreground/10 to-muted" />
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex h-95 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
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
          <span className="text-xs font-semibold tabular-nums">
            {fmtNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
