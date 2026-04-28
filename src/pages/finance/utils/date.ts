import { format, subWeeks } from 'date-fns';

export function todayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function fourWeeksAgoStr() {
  return format(subWeeks(new Date(), 4), 'yyyy-MM-dd');
}
