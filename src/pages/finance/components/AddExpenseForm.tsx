import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { Client, ExpenseCategoryRow } from '../types';
import { todayStr } from '../utils/date';
import {
  selectItemsCategories,
  selectItemsClients,
} from '../utils/select-items';

interface AddExpenseFormProps {
  clients: Client[];
  categories: ExpenseCategoryRow[];
  onSuccess: () => void;
}

export function AddExpenseForm({ clients, categories, onSuccess }: AddExpenseFormProps) {
  const [clientId, setClientId] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState(todayStr());
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KGS');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/expenses', body);
      return data;
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Расход успешно сохранён' });
      setClientId('');
      setExpenseDate(todayStr());
      setCategoryId('');
      setAmount('');
      setCurrency('KGS');
      setNote('');
      setTimeout(() => setMessage(null), 3000);
      onSuccess();
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Ошибка при сохранении';
      setMessage({ type: 'error', text: msg });
      setTimeout(() => setMessage(null), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !categoryId || !amount) return;
    mutation.mutate({
      client_id: clientId,
      expense_date: expenseDate,
      category_id: categoryId,
      amount: parseFloat(amount),
      currency: currency || undefined,
      note: note || undefined,
    });
  };

  return (
    <Card className="mt-4 max-w-lg">
      <CardHeader>
        <CardTitle>Новый расход</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Категория</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v as string)}
              items={selectItemsCategories(categories)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon_emoji ? `${c.icon_emoji} ${c.name}` : c.name}
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
              placeholder="0.00"
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
            <Input
              placeholder="Необязательно"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {message && (
            <p
              className={
                message.type === 'success' ? 'text-sm text-green-600' : 'text-sm text-destructive'
              }
            >
              {message.text}
            </p>
          )}

          <Button type="submit" disabled={mutation.isPending || !clientId || !categoryId || !amount}>
            <Plus className="size-4" />
            {mutation.isPending ? 'Сохранение...' : 'Сохранить расход'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
