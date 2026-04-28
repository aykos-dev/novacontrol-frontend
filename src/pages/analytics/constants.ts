import type { WbReport } from './types';

export const BREAKDOWN_ITEMS: { label: string; key: keyof WbReport['breakdown'] }[] = [
  { label: 'Комиссия WB', key: 'ppvz_reward' },
  { label: 'Логистика', key: 'delivery_rub' },
  { label: 'Хранение', key: 'storage_fee' },
  { label: 'Штрафы', key: 'penalty' },
  { label: 'Удержания', key: 'deduction' },
  { label: 'Операции при приемке', key: 'acceptance' },
  { label: 'Корректировка ВВ', key: 'rebill_logistic_cost' },
];
