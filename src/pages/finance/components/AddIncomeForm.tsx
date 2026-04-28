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

import type { Client } from '../types';
import { todayStr } from '../utils/date';
import { selectItemsClients } from '../utils/select-items';

interface AddIncomeFormProps {
  clients: Client[];
  onSuccess: () => void;
}

export function AddIncomeForm({ clients, onSuccess }: AddIncomeFormProps) {
  const [clientId, setClientId] = useState<string>('');
  const [incomeDate, setIncomeDate] = useState(todayStr());
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('KGS');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/incomes', body);
      return data;
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Пополнение успешно сохранено' });
      setClientId('');
      setIncomeDate(todayStr());
      setAmount('');
      setCurrency('USD');
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
    if (!clientId || !amount) return;
    mutation.mutate({
      client_id: clientId,
      income_date: incomeDate,
      amount: parseFloat(amount),
      currency: currency || undefined,
      note: note || undefined,
    });
  };

  return (
    <Card className="mt-4 max-w-lg">
      <CardHeader>
        <CardTitle>Новое пополнение</CardTitle>
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
              value={incomeDate}
              onChange={(e) => setIncomeDate(e.target.value)}
            />
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

          <Button type="submit" disabled={mutation.isPending || !clientId || !amount}>
            <Plus className="size-4" />
            {mutation.isPending ? 'Сохранение...' : 'Сохранить доход'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
