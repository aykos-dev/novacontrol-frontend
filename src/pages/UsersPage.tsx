import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { ALL_SECTIONS, canAccessSection, type AppSection } from '@/lib/sections';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  name: string;
  username: string;
  role: 'ADMIN' | 'VIEWER';
  allowed_sections: AppSection[] | null;
  telegram_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserFormData {
  name: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'VIEWER';
  allowed_sections: AppSection[];
  telegram_id: string;
}

const emptyForm: UserFormData = {
  name: '',
  username: '',
  password: '',
  role: 'VIEWER',
  allowed_sections: [],
  telegram_id: '',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function UsersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const hasUsersAccess = canAccessSection(currentUser, 'users');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // ---- Access guard ----

  if (!hasUsersAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShieldAlert className="mb-4 size-12 text-muted-foreground/50" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You do not have permission to view this page. Only administrators can
          manage users.
        </p>
      </div>
    );
  }

  // ---- Queries ----

  const {
    data: users = [],
    isLoading,
  } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  // ---- Mutations ----

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post('/users', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create user';
      setFormError(typeof message === 'string' ? message : String(message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/users/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to update user';
      setFormError(typeof message === 'string' ? message : String(message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    },
  });

  // ---- Dialog helpers ----

  function openCreateDialog() {
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      username: user.username,
      password: '',
      role: user.role,
      allowed_sections: user.allowed_sections ?? [],
      telegram_id: user.telegram_id ?? '',
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function openDeleteDialog(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Name is required');
      return;
    }
    if (!form.username.trim()) {
      setFormError('Username is required');
      return;
    }
    if (!editingUser && !form.password) {
      setFormError('Password is required');
      return;
    }

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      username: form.username.trim(),
      role: form.role,
      allowed_sections:
        form.role === 'ADMIN'
          ? ALL_SECTIONS.map((section) => section.id)
          : form.allowed_sections,
    };

    if (form.password) {
      body.password = form.password;
    }

    if (form.telegram_id.trim()) {
      body.telegram_id = form.telegram_id.trim();
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ---- Render ----

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t('users.pageTitle')}</h1>
        <Button onClick={openCreateDialog}>
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Telegram</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-32 text-center text-muted-foreground"
                >
                  No users found. Click "Add User" to create one.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.username}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {user.role === 'ADMIN'
                        ? 'All sections'
                        : (user.allowed_sections ?? []).map((sectionId) => {
                            const section = ALL_SECTIONS.find((s) => s.id === sectionId);
                            return section ? (
                              <Badge key={section.id} variant="outline">
                                {t(section.labelKey)}
                              </Badge>
                            ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {user.telegram_id ?? '\u2014'}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd-MM-yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Deactivate"
                        onClick={() => openDeleteDialog(user)}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add User'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Update user details. Leave password empty to keep the current one.'
                : 'Create a new user account.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name *</Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-username">Username *</Label>
              <Input
                id="user-username"
                value={form.username}
                onChange={(e) =>
                  setForm((f) => ({ ...f, username: e.target.value }))
                }
                placeholder="Username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-password">
                Password {editingUser ? '(optional)' : '*'}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder={
                  editingUser
                    ? 'Leave empty to keep current password'
                    : 'Password'
                }
                required={!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-role">Role</Label>
              <Select
                value={form.role}
                onValueChange={(val) =>
                  setForm((f) => ({
                    ...f,
                    role: val as 'ADMIN' | 'VIEWER',
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="VIEWER">VIEWER</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Section access</Label>
              <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
                {ALL_SECTIONS.map((section) => {
                  const checked =
                    form.role === 'ADMIN' ||
                    form.allowed_sections.includes(section.id);
                  return (
                    <label
                      key={section.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={form.role === 'ADMIN'}
                        onChange={(e) => {
                          setForm((f) => ({
                            ...f,
                            allowed_sections: e.target.checked
                              ? [...new Set([...f.allowed_sections, section.id])]
                              : f.allowed_sections.filter((id) => id !== section.id),
                          }));
                        }}
                      />
                      {t(section.labelKey)}
                    </label>
                  );
                })}
              </div>
              {form.role === 'ADMIN' && (
                <p className="text-xs text-muted-foreground">
                  Admin users always have access to all sections.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-telegram">
                Telegram (необязательно)
              </Label>
              <Input
                id="user-telegram"
                value={form.telegram_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telegram_id: e.target.value }))
                }
                placeholder="Числовой ID из Telegram (@userinfobot)"
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? editingUser
                    ? 'Saving...'
                    : 'Creating...'
                  : editingUser
                    ? 'Save Changes'
                    : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation (API sets is_active = false) */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate user</DialogTitle>
            <DialogDescription>
              User{' '}
              <span className="font-semibold">{deletingUser?.name}</span> will
              lose access until an administrator reactivates the account. This
              does not remove audit history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingUser(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingUser) {
                  deleteMutation.mutate(deletingUser.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
