import { format, subWeeks } from 'date-fns';

export function defaultDateRange() {
  const to = new Date();
  const from = subWeeks(to, 4);
  return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
}

export function formatTimestamp(value: string | null): string {
  if (!value) return 'Никогда';
  try {
    return format(new Date(value), 'dd.MM.yyyy HH:mm');
  } catch {
    return 'Никогда';
  }
}
