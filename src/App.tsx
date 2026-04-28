import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ClientsPage from '@/pages/ClientsPage';
import ClientDetailPage from '@/pages/ClientDetailPage';
import ExpenseCategoriesPage from '@/pages/ExpenseCategoriesPage';
import BalancesPage from '@/pages/BalancesPage';
import UsersPage from '@/pages/UsersPage';
import SettingsPage from '@/pages/SettingsPage';
import FinancePage from '@/pages/finance';
import AnalyticsPage from '@/pages/analytics';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import ThemeRoot from '@/components/ThemeRoot';

const queryClient = new QueryClient();

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
            <Route index element={<DashboardPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="expenses" element={<Navigate to="/finance" replace />} />
            <Route path="expense-categories" element={<ExpenseCategoriesPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="balances" element={<BalancesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
    </ThemeRoot>
  );
}

export default App;
