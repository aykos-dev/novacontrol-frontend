import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, LayoutDashboard } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  name: string;
  wb_token: string;
  currency: string;
  balance_alert_threshold: number | null;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

interface ClientFormData {
  name: string;
  wb_token: string;
  currency: string;
  balance_alert_threshold: string;
}

const emptyForm: ClientFormData = {
  name: "",
  wb_token: "",
  currency: "KGS",
  balance_alert_threshold: "",
};

export default function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  function goToClientDetail(clientId: string) {
    navigate(`/clients/${clientId}`);
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const {
    data: clients = [],
    isLoading,
  } = useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await api.get("/clients");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/clients", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create client";
      setFormError(typeof message === "string" ? message : String(message));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/clients/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      closeDialog();
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to update client";
      setFormError(typeof message === "string" ? message : String(message));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteDialogOpen(false);
      setDeletingClient(null);
    },
  });

  function openCreateDialog() {
    setEditingClient(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setForm({
      name: client.name,
      wb_token: "",
      currency: client.currency,
      balance_alert_threshold:
        client.balance_alert_threshold != null
          ? String(client.balance_alert_threshold)
          : "",
    });
    setFormError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingClient(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function openDeleteDialog(client: Client) {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const body: Record<string, unknown> = { name: form.name };

    if (form.wb_token) {
      body.wb_token = form.wb_token;
    } else if (!editingClient) {
      setFormError("WB Token is required");
      return;
    }

    if (form.currency) {
      body.currency = form.currency;
    }

    if (form.balance_alert_threshold !== "") {
      const threshold = Number(form.balance_alert_threshold);
      if (isNaN(threshold)) {
        setFormError("Alert threshold must be a number");
        return;
      }
      body.balance_alert_threshold = threshold;
    }

    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, body });
    } else {
      createMutation.mutate(body);
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function formatLastSync(value: string | null): string {
    if (!value) return "Never";
    try {
      return format(new Date(value), "dd.MM.yyyy HH:mm");
    } catch {
      return "Never";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("clients.pageTitle")}</h1>
        {isAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="size-4" />
            Add Client
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>WB Token</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Alert Threshold</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Sync</TableHead>
              <TableHead className="w-[1%] whitespace-nowrap">Dashboard</TableHead>
              {isAdmin && <TableHead>Actions</TableHead>}
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
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 8 : 7}
                  className="h-32 text-center text-muted-foreground"
                >
                  No clients found. {isAdmin && "Click \"Add Client\" to create one."}
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 font-medium"
                      onClick={() => goToClientDetail(client.id)}
                    >
                      {client.name}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {client.wb_token}
                  </TableCell>
                  <TableCell>{client.currency}</TableCell>
                  <TableCell>
                    {client.balance_alert_threshold != null
                      ? client.balance_alert_threshold.toLocaleString()
                      : "\u2014"}
                  </TableCell>
                  <TableCell>
                    {client.is_active ? (
                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatLastSync(client.last_sync_at)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => goToClientDetail(client.id)}
                    >
                      <LayoutDashboard className="size-3.5" aria-hidden />
                      Open
                    </Button>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(client)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(client)}
                        >
                          <Trash2 className="size-3.5 text-destructive" />
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Edit Client" : "Add Client"}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Update client details. Leave WB Token empty to keep the current one."
                : "Add a new Wildberries client to the system."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Name *</Label>
              <Input
                id="client-name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Client name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-token">
                WB Token {editingClient ? "(optional)" : "*"}
              </Label>
              <Input
                id="client-token"
                value={form.wb_token}
                onChange={(e) =>
                  setForm((f) => ({ ...f, wb_token: e.target.value }))
                }
                placeholder={
                  editingClient
                    ? "Leave empty to keep current token"
                    : "Wildberries API token"
                }
                required={!editingClient}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-currency">Currency</Label>
              <Input
                id="client-currency"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                placeholder="KGS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client-threshold">Alert Threshold</Label>
              <Input
                id="client-threshold"
                type="number"
                value={form.balance_alert_threshold}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    balance_alert_threshold: e.target.value,
                  }))
                }
                placeholder="Optional"
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
                  ? editingClient
                    ? "Saving..."
                    : "Creating..."
                  : editingClient
                    ? "Save Changes"
                    : "Create Client"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deletingClient?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingClient(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingClient) {
                  deleteMutation.mutate(deletingClient.id);
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
