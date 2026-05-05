import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { PieEntry } from '../types';
import { fmtNumber } from '../utils/format';

interface ExtraExpensesPieProps {
  data: PieEntry[];
  total: number;
}

export function ExtraExpensesPie({ data, total }: ExtraExpensesPieProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Дополнительные расходы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                cx="50%"
                cy="45%"
              >
                {data.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const entry = payload[0];
                  const pct =
                    total > 0
                      ? (((entry.value as number) / total) * 100).toFixed(1)
                      : '0';
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-md">
                      <p className="text-xs font-semibold">{entry.name}</p>
                      <p className="text-xs tabular-nums">
                        {fmtNumber(entry.value as number)} ({pct}%)
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
            {data.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>
                  {entry.label}: {fmtNumber(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
