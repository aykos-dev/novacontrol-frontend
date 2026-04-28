import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';

import api from '@/lib/api';
import DateRangePicker from '@/components/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import type { Client, Expense, ExpenseCategoryRow, ExpensesResponse } from '../types';
import { fourWeeksAgoStr, todayStr } from '../utils/date';
import {
  selectItemsCategories,
  selectItemsClients,
} from '../utils/select-items';
import { ExpenseEditDialog } from './ExpenseEditDialog';

export interface ExpensesHistoryTableProps {
  clients: Client[];
  categories: ExpenseCategoryRow[];
  isAdmin: boolean;
}

export function ExpensesHistoryTable({ clients, categories, isAdmin }: ExpensesHistoryTableProps) {
  const queryClient = useQueryClient();
  const [filterClient, setFilterClient] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: fourWeeksAgoStr(), to: todayStr() });
  const [page, setPage] = useState(1);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteExpense, setDeleteExpense] = useState<Expense | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const clearFilters = useCallback(() => {
    setFilterClient('');
    setFilterCategoryId('');
    setDateRange({ from: fourWeeksAgoStr(), to: todayStr() });
    setPage(1);
  }, []);

  const { data: expensesData, isLoading } = useQuery<ExpensesResponse>({
    queryKey: ['expenses', filterClient, filterCategoryId, dateRange, page],
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
      if (filterClient) params.clientId = filterClient;
      if (filterCategoryId) params.categoryId = filterCategoryId;
      if (dateRange.from) params.dateFrom = dateRange.from;
      if (dateRange.to) params.dateTo = dateRange.to;
      const { data } = await api.get('/expenses', { params });
      return data;
    },
  });

  const expenses = expensesData?.data ?? [];
  const total = expensesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      setDeleteOpen(false);
      setDeleteExpense(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const { data } = await api.patch(`/expenses/${id}`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
      setEditOpen(false);
      setEditExpense(null);
    },
  });

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
          <Label className="text-xs text-muted-foreground">Категория</Label>
          <Select
            value={filterCategoryId}
            onValueChange={(v) => {
              setFilterCategoryId(v as string);
              setPage(1);
            }}
            items={selectItemsCategories(categories)}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Все категории" />
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
              <TableHead>Категория</TableHead>
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
                  {Array.from({ length: isAdmin ? 10 : 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="py-10 text-center text-muted-foreground">
                  Нет расходов за выбранный период
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.expense_date}</TableCell>
                  <TableCell>{expense.client?.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {expense.expenseCategory
                        ? expense.expenseCategory.icon_emoji
                          ? `${expense.expenseCategory.icon_emoji} ${expense.expenseCategory.name}`
                          : expense.expenseCategory.name
                        : '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {Number(expense.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {expense.exchange_rate_kgs_per_usd != null && expense.exchange_rate_kgs_per_usd !== ''
                      ? Number(expense.exchange_rate_kgs_per_usd).toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {expense.amount_kgs != null && expense.amount_kgs !== ''
                      ? Number(expense.amount_kgs).toLocaleString('ru-RU', { minimumFractionDigits: 2 })
                      : Number(expense.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="max-w-50 truncate">{expense.note ?? '—'}</TableCell>
                  <TableCell>{expense.creator?.name ?? expense.creator?.username}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setEditExpense(expense);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => {
                            setDeleteExpense(expense);
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

      <ExpenseEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        expense={editExpense}
        clients={clients}
        categories={categories}
        isPending={editMutation.isPending}
        onSave={(id, body) => editMutation.mutate({ id, body })}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить расход?</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить расход на сумму{' '}
              <strong>
                {deleteExpense
                  ? `${Number(deleteExpense.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ${deleteExpense.currency}`
                  : ''}
              </strong>
              ? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteExpense && deleteMutation.mutate(deleteExpense.id)}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
