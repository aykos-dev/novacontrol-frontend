import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import type { Client, ExpenseCategoryRow } from './types';
import { AddExpenseForm } from './components/AddExpenseForm';
import { AddIncomeForm } from './components/AddIncomeForm';
import { HistorySection } from './components/HistorySection';

export default function FinancePage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<string | number>('expense');

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data } = await api.get('/clients');
      return data;
    },
  });

  const { data: expenseCategories = [] } = useQuery<ExpenseCategoryRow[]>({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const { data } = await api.get('/expense-categories');
      return data;
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold tracking-tight">Расходы и пополнении</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="expense">Расходы</TabsTrigger>
          <TabsTrigger value="income">Пополнении</TabsTrigger>
          <TabsTrigger value="history">История</TabsTrigger>
        </TabsList>

        <TabsContent value="expense">
          <AddExpenseForm
            clients={clients}
            categories={expenseCategories}
            onSuccess={() => {
              setActiveTab('history');
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
            }}
          />
        </TabsContent>

        <TabsContent value="income">
          <AddIncomeForm
            clients={clients}
            onSuccess={() => {
              setActiveTab('history');
              queryClient.invalidateQueries({ queryKey: ['incomes'] });
            }}
          />
        </TabsContent>

        <TabsContent value="history">
          <HistorySection
            clients={clients}
            categories={expenseCategories}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
