import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { getChartPalette } from '@/lib/chart-colors';
import { useThemeStore } from '@/stores/theme.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import type { RevenueChartEntry } from '../types';
import { fmtNumber, fmtThousands } from '../utils/format';
import { ChartAreaSkeleton } from './ChartAreaSkeleton';

function SectionCTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
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

export interface SectionCRevenueChartProps {
  data: RevenueChartEntry[];
  isLoading: boolean;
}

export function SectionCRevenueChart({ data, isLoading }: SectionCRevenueChartProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const palette = getChartPalette(resolved);
  const showEmpty = !isLoading && data.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Сводка по доходам</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartAreaSkeleton heightClass="h-[350px]" />
        ) : showEmpty ? (
          <div className="flex h-[350px] flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground">Нет данных</p>
            <p className="mt-1 max-w-sm text-xs">
              Нет дневных строк WB за период — график доходности появится после синхронизации.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data}>
              <CartesianGrid stroke={palette.gridStroke} strokeDasharray="3 3" />
              <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis
                tickFormatter={(v: number) => fmtThousands(v)}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<SectionCTooltip />} />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 12 }} />
              <ReferenceLine y={0} stroke={palette.referenceLine} strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="wbRevenue"
                name="Доход WB"
                stroke={palette.wbRevenueLine}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={1100}
              />
              <Line
                type="monotone"
                dataKey="realRevenue"
                name="Реальный доход"
                stroke={palette.realRevenueLine}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                isAnimationActive
                animationDuration={1100}
              />
              <Line
                type="monotone"
                dataKey="extraExpenses"
                name="Доп. расходы (KGS)"
                stroke={palette.extraExpensesLine}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive
                animationDuration={1100}
              />
              <Line
                type="monotone"
                dataKey="extraIncomes"
                name="Доп. пополнения (KGS)"
                stroke={palette.extraIncomesLine}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive
                animationDuration={1100}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
