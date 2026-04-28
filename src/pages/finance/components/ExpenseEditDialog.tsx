import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import type { Client, Expense, ExpenseCategoryRow } from '../types';
import {
  selectItemsCategoriesEdit,
  selectItemsClients,
} from '../utils/select-items';

export interface ExpenseEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  clients: Client[];
  categories: ExpenseCategoryRow[];
  isPending: boolean;
  onSave: (id: string, body: Record<string, unknown>) => void;
}

export function ExpenseEditDialog({
  open,
  onOpenChange,
  expense,
  clients,
  categories,
  isPending,
  onSave,
}: ExpenseEditDialogProps) {
  const [clientId, setClientId] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [currency, setCurrency] = useState('');
  const [note, setNote] = useState('');

  const categoryOptions = useMemo(() => {
    const list = [...categories];
    if (expense?.expenseCategory && !list.some((c) => c.id === expense.category_id)) {
      list.push(expense.expenseCategory);
    }
    return list;
  }, [categories, expense]);

  const [prevExpenseId, setPrevExpenseId] = useState<string | null>(null);
  if (expense && expense.id !== prevExpenseId) {
    setPrevExpenseId(expense.id);
    setClientId(expense.client_id);
    setExpenseDate(expense.expense_date);
    setCategoryId(expense.category_id);
    setAmount(String(expense.amount));
    setExchangeRate(
      expense.exchange_rate_kgs_per_usd != null && expense.exchange_rate_kgs_per_usd !== ''
        ? String(expense.exchange_rate_kgs_per_usd)
        : '',
    );
    setCurrency(expense.currency);
    setNote(expense.note ?? '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
    const body: Record<string, unknown> = {
      client_id: clientId,
      expense_date: expenseDate,
      category_id: categoryId,
      amount: parseFloat(amount),
      currency: currency || undefined,
      note: note || undefined,
    };
    const rate = parseFloat(exchangeRate);
    if (Number.isFinite(rate) && rate > 0) {
      body.exchange_rate_kgs_per_usd = rate;
    }
    onSave(expense.id, body);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать расход</DialogTitle>
          <DialogDescription>Измените данные расхода и сохраните.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Клиент</Label>
            <Select
              value={clientId}
              onValueChange={(v) => setClientId(v as string)}
              items={selectItemsClients(clients)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите клиента" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v as string)}
              items={selectItemsCategoriesEdit(categoryOptions)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon_emoji ? `${c.icon_emoji} ${c.name}` : c.name}
                    {!c.is_active ? ' (неактивна)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Сумма (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Курс (KGS за 1 USD)</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="Обязательно для пересчёта в KGS"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          </div>

          {expense?.amount_kgs != null && expense.amount_kgs !== '' && (
            <p className="text-xs text-muted-foreground">
              Сохранённый эквивалент:{' '}
              {Number(expense.amount_kgs).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} KGS
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Валюта записи</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Примечание</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !clientId || !categoryId || !amount}>
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
