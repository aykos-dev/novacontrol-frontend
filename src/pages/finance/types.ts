export interface Client {
  id: string;
  name: string;
}

export interface ExpenseCategoryRow {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  icon_emoji: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Expense {
  id: string;
  client_id: string;
  expense_date: string;
  category_id: string;
  amount: number;
  currency: string;
  note: string | null;
  created_at: string;
  client: { name: string };
  creator: { name: string; username: string };
  expenseCategory?: ExpenseCategoryRow;
}

export interface ExpensesResponse {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
}

export interface Income {
  id: string;
  client_id: string;
  income_date: string;
  amount: number;
  currency: string;
  note: string | null;
  created_at: string;
  client: { name: string };
  creator: { name: string; username: string };
}

export interface IncomesResponse {
  data: Income[];
  total: number;
  page: number;
  limit: number;
}
