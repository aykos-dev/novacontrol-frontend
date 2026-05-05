import type { WbReport } from './types';

export const MIXED_KGS = 'KGS';

export const BREAKDOWN_ITEMS: {
  label: string;
  key: keyof WbReport['breakdown'];
}[] = [
  { label: 'Комиссия WB', key: 'ppvz_reward' },
  { label: 'Логистика', key: 'delivery_rub' },
  { label: 'Хранение', key: 'storage_fee' },
  { label: 'Штрафы', key: 'penalty' },
  { label: 'Удержания', key: 'deduction' },
  { label: 'Приемка', key: 'acceptance' },
  { label: 'Корректировка ВВ', key: 'rebill_logistic_cost' },
];

export const SHOW_WB_BALANCE_CHANGE_BAR = false;
