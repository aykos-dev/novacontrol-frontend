import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

import { cn } from '@/lib/utils';
import { getChartPalette } from '@/lib/chart-colors';
import { useThemeStore } from '@/stores/theme.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { BREAKDOWN_ITEMS } from '../constants';
import type { ComposedChartEntry, WbReport } from '../types';
import { fmtNumber, fmtThousands } from '../utils/format';
import { ChartAreaSkeleton } from './ChartAreaSkeleton';

function SectionATooltip({
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

export interface SectionAChartProps {
  data: ComposedChartEntry[];
  breakdown: WbReport['breakdown'] | null;
  isLoading: boolean;
}

export function SectionAChart({ data, breakdown, isLoading }: SectionAChartProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const palette = getChartPalette(resolved);
  const retailSales = breakdown?.retail_sales ?? 0;
  const showEmpty = !isLoading && data.length === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Доходы и расходы WB</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartAreaSkeleton heightClass="h-[400px]" />
        ) : showEmpty ? (
          <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground">Нет данных WB</p>
            <p className="max-w-sm text-xs">
              За выбранный период нет строк отчёта. Выполните синхронизацию клиента или расширьте диапазон дат.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="min-w-0 flex-1">
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data}>
                  <CartesianGrid stroke={palette.gridStroke} strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis
                    tickFormatter={(v: number) => fmtThousands(v)}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<SectionATooltip />} />
                  <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 12 }} />
                  <ReferenceLine
                    y={0}
                    stroke={palette.referenceLine}
                    strokeDasharray="3 3"
                  />
                  <Bar
                    dataKey="income"
                    name="Приход"
                    fill={palette.incomeBar}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Bar
                    dataKey="expenses"
                    name="Расход"
                    fill={palette.expenseBar}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    isAnimationActive
                    animationDuration={900}
                  />
                  {/* <Line
                    type="monotone"
                    dataKey="cumulativeBalance"
                    name="Изменение баланса"
                    stroke={palette.balanceLine}
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive
                    animationDuration={1200}
                  /> */}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {breakdown && (
              <div className="shrink-0 space-y-3 lg:w-64">
                <h3 className="text-sm font-semibold text-muted-foreground">Разбивка</h3>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', palette.retailDot)} />
                    <span className="text-sm">Продажи</span>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">{fmtNumber(retailSales)}</span>
                </div>
                {BREAKDOWN_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border p-3">
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
  );
}
