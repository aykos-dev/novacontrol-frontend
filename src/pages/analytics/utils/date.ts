import { addDays, format, subWeeks } from 'date-fns';

export function defaultDateRange() {
  const to = new Date();
  const from = addDays(subWeeks(to, 4), 1);
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}
