import { format, parse } from 'date-fns';

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const DISPLAY_RE = /^\d{2}-\d{2}-\d{4}$/;

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isoToDisplay(value: string): string {
  if (!value) return '';
  if (!ISO_RE.test(value)) return value;
  return format(parse(value, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy');
}

export function displayToIso(value: string): string {
  if (!value) return '';
  if (ISO_RE.test(value)) return value;
  if (!DISPLAY_RE.test(value)) return value;
  return format(parse(value, 'dd-MM-yyyy', new Date()), 'yyyy-MM-dd');
}

export function formatDateTimeDisplay(value: string | null): string {
  if (!value) return 'Никогда';
  try {
    return format(new Date(value), 'dd-MM-yyyy HH:mm');
  } catch {
    return 'Никогда';
  }
}
