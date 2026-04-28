import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';

import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Skeleton } from '@/components/ui/skeleton';

interface ExpenseCategoryRow {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  icon_emoji: string | null;
  sort_order: number;
  is_active: boolean;
  creator?: { name: string; username: string } | null;
}

export default function ExpenseCategoriesPage() {
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg p-6 text-center text-muted-foreground">
        Раздел доступен только администраторам.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Категории расходов</h1>
      <CategoriesAdminPanel />
    </div>
  );
}

function CategoriesAdminPanel() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<ExpenseCategoryRow | null>(null);
  const [deleteRow, setDeleteRow] = useState<ExpenseCategoryRow | null>(null);

  const { data: rows = [], isLoading } = useQuery<ExpenseCategoryRow[]>({
    queryKey: ['expense-categories-admin'],
    queryFn: async () => {
      const { data } = await api.get<ExpenseCategoryRow[]>('/expense-categories/admin');
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    queryClient.invalidateQueries({ queryKey: ['expense-categories-admin'] });
  };

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const { data } = await api.post('/expense-categories', body);
      return data;
    },
    onSuccess: () => {
      invalidate();
      setCreateOpen(false);
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      const { data } = await api.patch(`/expense-categories/${id}`, body);
      return data;
    },
    onSuccess: () => {
      invalidate();
      setEditRow(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expense-categories/${id}`);
    },
    onSuccess: () => {
      invalidate();
      setDeleteRow(null);
    },
  });

  const colCount = 8;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Slug задаётся один раз (латиница, цифры, _). Название и цвет можно менять в любой момент.
        </p>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          Новая категория
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Порядок</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Цвет</TableHead>
              <TableHead>Эмодзи</TableHead>
              <TableHead>Активна</TableHead>
              <TableHead>Создал</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: colCount }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="py-10 text-center text-muted-foreground">
                  Нет категорий
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="tabular-nums">{row.sort_order}</TableCell>
                  <TableCell className="font-mono text-xs">{row.slug}</TableCell>
                  <TableCell>
                    {row.icon_emoji ? `${row.icon_emoji} ${row.name}` : row.name}
                  </TableCell>
                  <TableCell>
                    {row.color ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block size-4 rounded border"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="text-xs text-muted-foreground">{row.color}</span>
                      </span>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>{row.icon_emoji ?? '—'}</TableCell>
                  <TableCell>{row.is_active ? 'Да' : 'Нет'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.creator?.name ?? row.creator?.username ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setEditRow(row)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-xs"
                        onClick={() => setDeleteRow(row)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        isPending={createMutation.isPending}
        onSubmit={(body) => createMutation.mutate(body)}
        errorMessage={
          createMutation.isError
            ? String(
                (createMutation.error as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? 'Ошибка',
              )
            : undefined
        }
      />

      <CategoryEditDialog
        open={!!editRow}
        onOpenChange={(o) => !o && setEditRow(null)}
        row={editRow}
        isPending={patchMutation.isPending}
        onSubmit={(id, body) => patchMutation.mutate({ id, body })}
      />

      <Dialog open={!!deleteRow} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить категорию?</DialogTitle>
            <DialogDescription>
              Категорию «{deleteRow?.name}» можно удалить только если нет расходов с этой
              категорией. Иначе отключите её (неактивна).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setDeleteRow(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={deleteMutation.isPending}
              onClick={() => deleteRow && deleteMutation.mutate(deleteRow.id)}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
          {deleteMutation.isError && (
            <p className="text-sm text-destructive">
              {(deleteMutation.error as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ?? 'Не удалось удалить'}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryCreateDialog({
  open,
  onOpenChange,
  isPending,
  onSubmit,
  errorMessage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
  onSubmit: (body: Record<string, unknown>) => void;
  errorMessage?: string;
}) {
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6b7280');
  const [iconEmoji, setIconEmoji] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const reset = () => {
    setSlug('');
    setName('');
    setColor('#6b7280');
    setIconEmoji('');
    setSortOrder('0');
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новая категория</DialogTitle>
          <DialogDescription>Slug не меняется после создания.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!slug.trim() || !name.trim()) return;
            onSubmit({
              slug: slug.trim(),
              name: name.trim(),
              color: color.trim() || undefined,
              icon_emoji: iconEmoji.trim() || undefined,
              sort_order: parseInt(sortOrder, 10) || 0,
              is_active: true,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              className="font-mono text-sm"
              placeholder="my_category"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Цвет (#RRGGBB)</Label>
            <Input className="font-mono text-sm" value={color} onChange={(e) => setColor(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Эмодзи (необязательно)</Label>
            <Input value={iconEmoji} onChange={(e) => setIconEmoji(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Порядок сортировки</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isPending || !slug.trim() || !name.trim()}>
              {isPending ? 'Создание...' : 'Создать'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryEditDialog({
  open,
  onOpenChange,
  row,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ExpenseCategoryRow | null;
  isPending: boolean;
  onSubmit: (id: string, body: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [iconEmoji, setIconEmoji] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [prevId, setPrevId] = useState<string | null>(null);
  if (row && row.id !== prevId) {
    setPrevId(row.id);
    setName(row.name);
    setColor(row.color ?? '');
    setIconEmoji(row.icon_emoji ?? '');
    setSortOrder(String(row.sort_order));
    setIsActive(row.is_active);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!row ? null : (
          <>
            <DialogHeader>
              <DialogTitle>Редактировать: {row.slug}</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!row) return;
                onSubmit(row.id, {
                  name: name.trim(),
                  color: color.trim(),
                  icon_emoji: iconEmoji.trim(),
                  sort_order: parseInt(sortOrder, 10) || 0,
                  is_active: isActive,
                });
              }}
            >
              <div className="space-y-1.5">
                <Label>Название</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Цвет (#RRGGBB или пусто)</Label>
                <Input className="font-mono text-sm" value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Эмодзи</Label>
                <Input value={iconEmoji} onChange={(e) => setIconEmoji(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Порядок</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="cat-active"
                  type="checkbox"
                  className="size-4 rounded border"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <Label htmlFor="cat-active" className="font-normal">
                  Активна (в списках при добавлении расхода)
                </Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isPending || !name.trim()}>
                  {isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
