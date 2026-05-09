import { cn } from '@/lib/utils';
import { getChartPalette } from '@/lib/chart-colors';
import { useThemeStore } from '@/stores/theme.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { BREAKDOWN_ITEMS } from '../constants';
import type { WbReport } from '../types';
import { fmtNumber } from '../utils/format';
import { ChartAreaSkeleton } from './ChartAreaSkeleton';

export interface SectionABreakdownProps {
  breakdown: WbReport['breakdown'] | null;
  isLoading: boolean;
}

export function SectionABreakdown({ breakdown, isLoading }: SectionABreakdownProps) {
  const resolved = useThemeStore((s) => s.resolved);
  const palette = getChartPalette(resolved);
  const retailSales = breakdown?.retail_sales ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Распределение</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ChartAreaSkeleton heightClass="h-[350px]" />
        ) : !breakdown ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            Нет данных WB
          </div>
        ) : (
          <div className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
