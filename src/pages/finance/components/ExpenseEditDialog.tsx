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
    setCurrency(expense.currency);
    setNote(expense.note ?? '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;
    onSave(expense.id, {
      client_id: clientId,
      expense_date: expenseDate,
      category_id: categoryId,
      amount: parseFloat(amount),
      currency: currency || undefined,
      note: note || undefined,
    });
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
            <Label>Сумма</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Валюта</Label>
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
