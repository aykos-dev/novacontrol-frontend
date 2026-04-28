import type { Client } from '../types';

export function selectItemsClients(clients: Client[]) {
  return clients.map((c) => ({ value: c.id, label: c.name }));
}
