import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/client-detail';
import ExpenseCategoriesPage from '@/pages/ExpenseCategoriesPage';
import BalancesPage from '@/pages/BalancesPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import FinancePage from '@/pages/finance';
import AnalyticsPage from '@/pages/analytics';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import ThemeRoot from '@/components/ThemeRoot';
import { type AppSection } from '@/lib/sections';

const queryClient = new QueryClient();

function SectionRoute({
  section,
  children,
}: {
  section: AppSection;
  children: ReactNode;
}) {
  return <ProtectedRoute section={section}>{children}</ProtectedRoute>;
}

function App() {
  return (
    <ThemeRoot>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SectionRoute section="dashboard"><DashboardPage /></SectionRoute>} />
            <Route path="clients/:id" element={<SectionRoute section="clients"><ClientDetailPage /></SectionRoute>} />
            <Route path="clients" element={<SectionRoute section="clients"><ClientsPage /></SectionRoute>} />
            <Route path="finance" element={<SectionRoute section="finance"><FinancePage /></SectionRoute>} />
            <Route path="expenses" element={<Navigate to="/finance" replace />} />
            <Route path="expense-categories" element={<SectionRoute section="expenseCategories"><ExpenseCategoriesPage /></SectionRoute>} />
            <Route path="analytics" element={<SectionRoute section="analytics"><AnalyticsPage /></SectionRoute>} />
            <Route path="balances" element={<SectionRoute section="clients"><BalancesPage /></SectionRoute>} />
            <Route path="users" element={<SectionRoute section="users"><UsersPage /></SectionRoute>} />
            <Route path="settings" element={<SectionRoute section="settings"><SettingsPage /></SectionRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ThemeRoot>
  );
}

export default App;
