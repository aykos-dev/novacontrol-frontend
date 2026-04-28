import type { Client, ExpenseCategoryRow } from '../types';

/** Base UI `Select` needs `items` so the closed trigger shows labels, not raw values (e.g. UUIDs). */
export function selectItemsClients(clients: Client[]) {
  return clients.map((c) => ({ value: c.id, label: c.name }));
}

export function selectItemsCategories(categories: ExpenseCategoryRow[]) {
  return categories.map((c) => ({
    value: c.id,
    label: c.icon_emoji ? `${c.icon_emoji} ${c.name}` : c.name,
  }));
}

export function selectItemsCategoriesEdit(categories: ExpenseCategoryRow[]) {
  return categories.map((c) => ({
    value: c.id,
    label: `${c.icon_emoji ? `${c.icon_emoji} ${c.name}` : c.name}${
      !c.is_active ? ' (неактивна)' : ''
    }`,
  }));
}
