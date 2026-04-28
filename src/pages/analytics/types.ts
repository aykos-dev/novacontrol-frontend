export interface Client {
  id: string;
  name: string;
}

export interface DailyEntry {
  date: string;
  income: number;
  expenses: number;
  balance_change: number;
}

export interface WbReport {
  daily: DailyEntry[];
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
  grandTotalKgs?: number;
}

export interface IncomesSummary {
  grandTotal: number;
  grandTotalKgs?: number;
}

export interface DailyExpenseRow {
  date: string;
  total: number;
}

export interface ComposedChartEntry {
  date: string;
  dateLabel: string;
  income: number;
  expenses: number;
  cumulativeBalance: number;
}

export interface PieEntry {
  category: string;
  label: string;
  value: number;
  color: string;
}

export interface RevenueChartEntry {
  date: string;
  dateLabel: string;
  wbRevenue: number;
  realRevenue: number;
  extraExpenses: number;
  extraIncomes: number;
}
