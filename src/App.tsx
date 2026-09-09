import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { initializeMonth } from './db';

// Placeholder screens
import { HomeScreen } from './screens/HomeScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { SavingsScreen } from './screens/SavingsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { AppProvider, useAppMonth } from './AppContext';

function AppContent() {
  const { selectedMonthId } = useAppMonth();

  // Initialize DB on first load for the selected month
  useEffect(() => {
    initializeMonth(selectedMonthId).catch(console.error);
  }, [selectedMonthId]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomeScreen />} />
          <Route path="budget" element={<BudgetScreen />} />
          <Route path="expenses" element={<ExpensesScreen />} />
          <Route path="savings" element={<SavingsScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
