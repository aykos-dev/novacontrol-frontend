import { addDays, format, subWeeks } from 'date-fns';

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function fourWeeksAgoStr() {
  return format(addDays(subWeeks(new Date(), 4), 1), 'yyyy-MM-dd');
}
