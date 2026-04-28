import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import type { PieEntry } from '../types';
import { fmtNumber } from '../utils/format';
import { ChartAreaSkeleton } from './ChartAreaSkeleton';

function SectionBTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PieEntry }>;
  total: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="text-xs font-semibold">{entry.name}</span>
      </div>
      <p className="mt-1 text-xs tabular-nums">
        {fmtNumber(entry.value)} ({pct}%)
      </p>
    </div>
  );
}

export interface SectionBPieChartProps {
  data: PieEntry[];
  total: number;
  isLoading: boolean;
}

export function SectionBPieChart({ data, total, isLoading }: SectionBPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Дополнительные расходы</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartAreaSkeleton heightClass="h-[350px]" />
        ) : data.length === 0 ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            Нет данных о расходах
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  cx="50%"
                  cy="45%"
                  isAnimationActive
                  animationDuration={800}
                >
                  {data.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<SectionBTooltip total={total} />} />
                <text
                  x="50%"
                  y="43%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-foreground text-sm font-semibold"
                >
                  {fmtNumber(total)}
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
              {data.map((entry) => {
                const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0';
                return (
                  <div key={entry.category} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span>
                      {entry.label}: {fmtNumber(entry.value)} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
