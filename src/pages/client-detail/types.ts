export interface Client {
  id: string;
  name: string;
  currency: string;
  is_active: boolean;
  last_sync_at: string | null;
  last_balance_sync_at: string | null;
  balance_alert_threshold: number | null;
}

export interface WbReport {
  daily: {
    date: string;
    income: number;
    expenses: number;
    balance_change: number;
  }[];
  totals: {
    income: number;
    expenses: number;
    retail_sales: number;
    balance_change: number;
  };
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

export interface Balance {
  id: string;
  current: number;
  for_withdraw: number;
  currency: string;
  snapshot_at: string;
}

export interface ExpensesSummary {
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

export interface IncomesSummary {
  grandTotal: number;
}

export interface ComposedChartEntry {
  date: string;
  dateLabel: string;
  income: number;
  expenses: number;
  balanceChange: number;
  cumulativeBalance: number;
}

export interface PieEntry {
  id: string;
  label: string;
  value: number;
  color: string;
}
