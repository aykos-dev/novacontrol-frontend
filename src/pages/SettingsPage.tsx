import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Play, Loader2, Clock, Settings2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface SchedulerJob {
  id: string;
  label: string;
  description: string;
  scheduleLabel: string;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="mx-auto max-w-lg p-6 text-center text-muted-foreground">
        {t('settings.adminOnly')}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 md:p-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary">
          <Settings2 className="size-7" aria-hidden />
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </header>

      <SchedulerJobsPanel />
    </div>
  );
}

function SchedulerJobsPanel() {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<{
    label: string;
    ok: boolean;
    started?: boolean;
    error?: string;
  } | null>(null);

  const { data: jobs = [], isLoading, isError, refetch } = useQuery<SchedulerJob[]>({
    queryKey: ['scheduler-jobs'],
    queryFn: async () => {
      const { data } = await api.get<SchedulerJob[]>('/wb/scheduler/jobs');
      return data;
    },
  });

  const runMutation = useMutation({
    mutationFn: async ({ id }: { id: string; label: string }) => {
      const { data } = await api.post<{ ok: boolean; jobId: string; started: boolean }>(
        `/wb/scheduler/jobs/${id}/run`,
      );
      return data;
    },
    onSuccess: (data, variables) => {
      setLastResult({ label: variables.label, ok: true, started: data.started });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      void queryClient.invalidateQueries({ queryKey: ['wb'] });
    },
    onError: (err: unknown) => {
      let message = 'Не удалось выполнить задачу';
      if (err && typeof err === 'object' && 'response' in err) {
        const raw = (err as { response?: { data?: { message?: unknown } } }).response?.data?.message;
        if (typeof raw === 'string') message = raw;
        else if (Array.isArray(raw)) message = raw.join(', ');
      }
      setLastResult({ label: '', ok: false, error: message });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Не удалось загрузить список задач</CardTitle>
          <CardDescription>Проверьте, что backend запущен и вы вошли как администратор.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={() => void refetch()}>
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4" aria-label="Запланированные задачи">
      {lastResult && (
        <p
          role="status"
          className={
            lastResult.ok
              ? 'rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-foreground'
              : 'rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
        >
          {lastResult.ok
            ? lastResult.started
              ? `Запущено: ${lastResult.label}. Данные будут обновляться в фоне.`
              : `Уже выполняется: ${lastResult.label}.`
            : lastResult.error ?? 'Ошибка'}
        </p>
      )}

      <ul className="space-y-4">
        {jobs.map((job) => {
          const isRunning = runMutation.isPending && runMutation.variables?.id === job.id;
          return (
            <li key={job.id}>
              <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3 pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="font-heading text-base">{job.label}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1 font-normal">
                          <Clock className="size-3.5 opacity-70" aria-hidden />
                          {job.scheduleLabel}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 gap-1.5"
                      disabled={runMutation.isPending}
                      onClick={() => {
                        setLastResult(null);
                        runMutation.mutate({ id: job.id, label: job.label });
                      }}
                    >
                      {isRunning ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                      ) : (
                        <Play className="size-4" aria-hidden />
                      )}
                      Запустить
                    </Button>
                  </div>
                  <CardDescription className="text-pretty">{job.description}</CardDescription>
                </CardHeader>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
