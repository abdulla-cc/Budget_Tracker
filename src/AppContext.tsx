import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { getCurrentMonthId } from './utils';

type AppContextType = {
  selectedMonthId: string;
  setSelectedMonthId: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedMonthId, setSelectedMonthId] = useState(getCurrentMonthId());
  
  return (
    <AppContext.Provider value={{ selectedMonthId, setSelectedMonthId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppMonth() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppMonth must be used within AppProvider');
  return context;
}


