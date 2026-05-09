import { format } from 'date-fns';

export function fmtNumber(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtThousands(value: number): string {
  return `${(value / 1000).toFixed(0)}k`;
}

export function formatDateTick(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return format(d, 'dd-MM');
  } catch {
    return dateStr;
  }
}
