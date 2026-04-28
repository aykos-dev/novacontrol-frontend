import type { ResolvedTheme } from '@/stores/theme.store';

/** Recharts-friendly palette aligned with Wildberries-inspired UI tokens. */
export function getChartPalette(resolved: ResolvedTheme) {
  if (resolved === 'dark') {
    return {
      incomeBar: '#f0abfc',
      expenseBar: '#c4b5fd',
      balanceChangeBar: '#22d3ee',
      balanceLine: '#94a3b8',
      referenceLine: 'rgba(148, 163, 184, 0.45)',
      gridStroke: 'rgba(148, 163, 184, 0.12)',
      retailDot: 'bg-fuchsia-400',
      breakdownDot: 'bg-violet-400',
      wbRevenueLine: '#f0abfc',
      realRevenueLine: '#6ee7b7',
      extraExpensesLine: '#fca5a5',
      extraIncomesLine: '#5eead4',
    };
  }
  return {
    incomeBar: '#cb11ab',
    expenseBar: '#6d28d9',
    balanceChangeBar: '#0891b2',
    balanceLine: '#64748b',
    referenceLine: '#cbd5e1',
    gridStroke: '#e2e8f0',
    retailDot: 'bg-fuchsia-600',
    breakdownDot: 'bg-violet-600',
    wbRevenueLine: '#cb11ab',
    realRevenueLine: '#059669',
    extraExpensesLine: '#dc2626',
    extraIncomesLine: '#0d9488',
  };
}
