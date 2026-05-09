import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { displayToIso, isoToDisplay } from '@/lib/date-format';
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

import type { Client, Income } from '../types';
import { selectItemsClients } from '../utils/select-items';

export interface IncomeEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income: Income | null;
  clients: Client[];
  isPending: boolean;
  onSave: (id: string, body: Record<string, unknown>) => void;
}

export function IncomeEditDialog({
  open,
  onOpenChange,
  income,
  clients,
  isPending,
  onSave,
}: IncomeEditDialogProps) {
  const [clientId, setClientId] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  const [amount, setAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [currency, setCurrency] = useState('');
  const [note, setNote] = useState('');

  const [prevId, setPrevId] = useState<string | null>(null);
  if (income && income.id !== prevId) {
    setPrevId(income.id);
    setClientId(income.client_id);
    setIncomeDate(income.income_date);
    setAmount(String(income.amount));
    setExchangeRate(
      income.exchange_rate_kgs_per_usd != null && income.exchange_rate_kgs_per_usd !== ''
        ? String(income.exchange_rate_kgs_per_usd)
        : '',
    );
    setCurrency(income.currency);
    setNote(income.note ?? '');
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;
    const body: Record<string, unknown> = {
      client_id: clientId,
      income_date: incomeDate,
      amount: parseFloat(amount),
      currency: currency || undefined,
      note: note || undefined,
    };
    const rate = parseFloat(exchangeRate);
    if (Number.isFinite(rate) && rate > 0) {
      body.exchange_rate_kgs_per_usd = rate;
    }
    onSave(income.id, body);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать доход</DialogTitle>
          <DialogDescription>Измените данные и сохраните.</DialogDescription>
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
                <SelectValue placeholder="Клиент" />
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
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Курс (KGS за 1 USD)</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              placeholder="Курс"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
            />
          </div>
          {income?.amount_kgs != null && income.amount_kgs !== '' && (
            <p className="text-xs text-muted-foreground">
              Эквивалент:{' '}
              {Number(income.amount_kgs).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} KGS
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !clientId || !amount}>
              {isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
