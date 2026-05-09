import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { displayToIso, isoToDisplay } from '@/lib/date-format';
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

function previewKgs(usd: string, rate: string): number | null {
  const u = parseFloat(usd);
  const r = parseFloat(rate);
  if (!Number.isFinite(u) || !Number.isFinite(r) || u <= 0 || r <= 0) return null;
  return Math.round(u * r * 100) / 100;
}

export function AddIncomeForm({ clients, onSuccess }: AddIncomeFormProps) {
  const [clientId, setClientId] = useState<string>('');
  const [incomeDate, setIncomeDate] = useState(todayStr());
  const [amountUsd, setAmountUsd] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const kgsPreview = useMemo(
    () => previewKgs(amountUsd, exchangeRate),
    [amountUsd, exchangeRate],
  );

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/incomes', body);
      return data;
    },
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Пополнение успешно сохранено' });
      setClientId('');
      setIncomeDate(todayStr());
      setAmountUsd('');
      setExchangeRate('');
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
    const amt = parseFloat(amountUsd);
    const rate = parseFloat(exchangeRate);
    if (!clientId || !Number.isFinite(amt) || !Number.isFinite(rate)) return;
    if (amt <= 0 || rate <= 0) return;
    mutation.mutate({
      client_id: clientId,
      income_date: incomeDate,
      amount: amt,
      exchange_rate_kgs_per_usd: rate,
      currency: 'USD',
      note: note || undefined,
    });
  };

  const canSubmit =
    !!clientId && parseFloat(amountUsd) > 0 && parseFloat(exchangeRate) > 0;

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
              inputMode="numeric"
              placeholder="dd-mm-yyyy"
              value={isoToDisplay(incomeDate)}
              onChange={(e) => setIncomeDate(displayToIso(e.target.value))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Сумма (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amountUsd}
              onChange={(e) => setAmountUsd(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Курс (KGS за 1 USD)</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="87.5"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          </div>

          {kgsPreview != null && (
            <p className="text-sm text-muted-foreground">
              Эквивалент:{' '}
              <span className="font-medium tabular-nums text-foreground">
                {kgsPreview.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} KGS
              </span>
            </p>
          )}

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

          <Button type="submit" disabled={mutation.isPending || !canSubmit}>
            <Plus className="size-4" />
            {mutation.isPending ? 'Сохранение...' : 'Сохранить доход'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
