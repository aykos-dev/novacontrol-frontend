import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import type { Client, ExpenseCategoryRow } from './types';
import { AddExpenseForm } from './components/AddExpenseForm';
import { AddIncomeForm } from './components/AddIncomeForm';
import { HistorySection } from './components/HistorySection';

export default function FinancePage() {
  const { t } = useTranslation();
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
      <h1 className="text-2xl font-bold tracking-tight">{t('finance.pageTitle')}</h1>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="expense">{t('finance.tabExpense')}</TabsTrigger>
          <TabsTrigger value="income">{t('finance.tabIncome')}</TabsTrigger>
          <TabsTrigger value="history">{t('finance.tabHistory')}</TabsTrigger>
        </TabsList>

        <TabsContent value="expense">
          <AddExpenseForm
            clients={clients}
            categories={expenseCategories}
            onSuccess={() => {
              setActiveTab('history');
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
              queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
              queryClient.invalidateQueries({ queryKey: ['incomes-summary'] });
            }}
          />
        </TabsContent>

        <TabsContent value="income">
          <AddIncomeForm
            clients={clients}
            onSuccess={() => {
              setActiveTab('history');
              queryClient.invalidateQueries({ queryKey: ['incomes'] });
              queryClient.invalidateQueries({ queryKey: ['expenses-summary'] });
              queryClient.invalidateQueries({ queryKey: ['incomes-summary'] });
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
