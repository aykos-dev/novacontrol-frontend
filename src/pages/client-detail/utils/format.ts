import { format } from 'date-fns';

export function fmtNumber(value: number): string {
  return value.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtCurrency(amount: number, currency: string): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount < 0 ? '-' : '';
  const c = currency?.toUpperCase();
  if (c === 'USD') return `${sign}$${formatted}`;
  if (c === 'KGS') return `${sign}${formatted} KGS`;
  return `${sign}${formatted} ₽`;
}

export function fmtThousands(value: number): string {
  return `${(value / 1000).toFixed(0)}k`;
}

export function formatDateTick(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd.MM');
  } catch {
    return dateStr;
  }
}
