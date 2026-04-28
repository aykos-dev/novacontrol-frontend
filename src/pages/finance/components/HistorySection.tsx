import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import type { Client, ExpenseCategoryRow } from '../types';
import { ExpensesHistoryTable } from './ExpensesHistoryTable';
import { IncomesHistoryTable } from './IncomesHistoryTable';

export interface HistorySectionProps {
  clients: Client[];
  categories: ExpenseCategoryRow[];
  isAdmin: boolean;
}

export function HistorySection({ clients, categories, isAdmin }: HistorySectionProps) {
  const [historyKind, setHistoryKind] = useState<'expenses' | 'incomes'>('expenses');

  return (
    <div className="mt-4 space-y-4">
      <Tabs value={historyKind} onValueChange={(v) => setHistoryKind(v as 'expenses' | 'incomes')}>
        <TabsList>
          <TabsTrigger value="expenses">Расходы</TabsTrigger>
          <TabsTrigger value="incomes">Пополнения</TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-4">
          <ExpensesHistoryTable clients={clients} categories={categories} isAdmin={isAdmin} />
        </TabsContent>
        <TabsContent value="incomes" className="mt-4">
          <IncomesHistoryTable clients={clients} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
