import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, PieChart, Receipt, PiggyBank, Settings } from 'lucide-react';
import { cn } from '../utils';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/budget', icon: PieChart, label: 'Budget' },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/savings', icon: PiggyBank, label: 'Savings' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-[80px]">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white border-t border-gray-200 px-2 py-2 flex justify-between items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] safe-area-pb">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <item.icon size={22} className={cn("mb-1", isActive && "fill-blue-100")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

