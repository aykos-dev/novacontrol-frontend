import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';

import api from '@/lib/api';
import DateRangePicker from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { PAGE_LIMIT } from '../constants';
import type { Client, Income, IncomesResponse } from '../types';
import { fourWeeksAgoStr, todayStr } from '../utils/date';
import { selectItemsClients } from '../utils/select-items';
import { IncomeEditDialog } from './IncomeEditDialog';

export interface IncomesHistoryTableProps {
  clients: Client[];
  isAdmin: boolean;
}

export function IncomesHistoryTable({ clients, isAdmin }: IncomesHistoryTableProps) {
  const queryClient = useQueryClient();
  const [filterClient, setFilterClient] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: fourWeeksAgoStr(), to: todayStr() });
  const [page, setPage] = useState(1);
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteIncome, setDeleteIncome] = useState<Income | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const clearFilters = useCallback(() => {
    setFilterClient('');
    setDateRange({ from: fourWeeksAgoStr(), to: todayStr() });
    setPage(1);
  }, []);

  const { data: incomesData, isLoading } = useQuery<IncomesResponse>({
    queryKey: ['incomes', filterClient, dateRange, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (filterClient) params.clientId = filterClient;
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;
      const { data } = await api.get('/incomes', { params });
      return data;
    },
  });

  const incomes = incomesData?.data ?? [];
  const total = incomesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes-summary'] });
      setDeleteOpen(false);
      setDeleteIncome(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const { data } = await api.patch(`/incomes/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['incomes-summary'] });
      setEditOpen(false);
      setEditIncome(null);
    },
  });

  const colCount = isAdmin ? 9 : 8;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Клиент</Label>
          <Select
            value={filterClient}
            onValueChange={(v) => {
              setFilterClient(v as string);
              setPage(1);
            }}
            items={selectItemsClients(clients)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Все клиенты" />
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
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Период</Label>
          <DateRangePicker
            value={dateRange}
            onChange={(v) => {
              setDateRange(v);
              setPage(1);
            }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Сбросить
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Дата</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead className="text-right">USD</TableHead>
              <TableHead className="text-right">Курс</TableHead>
              <TableHead className="text-right">KGS</TableHead>
              <TableHead>Примечание</TableHead>
              <TableHead>Создал</TableHead>
              {isAdmin && <TableHead>Действия</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colCount }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : incomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                  Нет доходов за выбранный период
                </TableCell>
              </TableRow>
            ) : (
              incomes.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.income_date}</TableCell>
                  <TableCell>{row.client?.name}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    {Number(row.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {row.exchange_rate_kgs_per_usd != null && row.exchange_rate_kgs_per_usd !== ''
                      ? Number(row.exchange_rate_kgs_per_usd).toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {row.amount_kgs != null && row.amount_kgs !== ''
                      ? Number(row.amount_kgs).toLocaleString('ru-RU', { minimumFractionDigits: 2 })
                      : Number(row.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="max-w-50 truncate">{row.note ?? '—'}</TableCell>
                  <TableCell>{row.creator?.name ?? row.creator?.username}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setEditIncome(row);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => {
                            setDeleteIncome(row);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            Страница {page} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Вперёд
          </Button>
        </div>
      )}

      <IncomeEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        income={editIncome}
        clients={clients}
        isPending={editMutation.isPending}
        onSave={(id, body) => editMutation.mutate({ id, body })}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить доход?</DialogTitle>
            <DialogDescription>
              Удалить доход на сумму{' '}
              <strong>
                {deleteIncome
                  ? `${Number(deleteIncome.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${deleteIncome.currency}`
                  : ''}
              </strong>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteIncome && deleteMutation.mutate(deleteIncome.id)}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
