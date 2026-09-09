import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatMoney, formatMonthYear } from '../utils';
import { useAppMonth } from '../AppContext';
import { Card, ProgressBar } from '../components/ui';
import { Plus } from 'lucide-react';
import { ExpenseModal } from '../components/ExpenseModal';
import { differenceInDays, endOfMonth } from 'date-fns';

export function HomeScreen() {
  const { selectedMonthId: currentMonthId } = useAppMonth();
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Queries
  const currentMonth = useLiveQuery(() => db.months.get(currentMonthId), [currentMonthId]);
  const categories = useLiveQuery(() => db.categories.where('monthId').equals(currentMonthId).toArray(), [currentMonthId]);
  const transactions = useLiveQuery(() => db.transactions.where('monthId').equals(currentMonthId).toArray(), [currentMonthId]);

  if (!currentMonth || !categories || !transactions) return <div className="p-4 text-center mt-10">Loading...</div>;

  // Derivations
  const allowance = currentMonth.allowance;
  
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalSpent = expenses.reduce((sum, t) => sum + t.amount, 0);
  const remainingAllowance = allowance - totalSpent;

  // Calculate unallocated
  const totalAllocated = categories.reduce((sum, c) => sum + c.budget, 0);
  const unallocated = allowance - totalAllocated;

  // Calculate Safe to Spend
  // "Safe To Spend Per Day = Remaining Spendable Money / Days Remaining"
  // Protected savings shouldn't be counted in safe to spend
  
  
  
  
  
  // Spendable is remaining allowance minus the savings we still intend to save
   // Or does unallocated count as spendable? Let's say yes, unallocated is spendable. 
  // Wait, requirement says "Emergency savings that have been intentionally protected should not be treated as freely spendable".
  // So Spendable = Remaining Allowance - (Total Savings Budget - already saved). Or more simply:
  // Spendable = Remaining Non-Savings Budget + Unallocated.
  const nonSavingsCategories = categories.filter(c => !c.isSavings);
  const nonSavingsRemaining = nonSavingsCategories.reduce((sum, c) => {
    const spent = expenses.filter(t => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
    return sum + (c.budget - spent);
  }, 0);
  
  const totalSpendable = nonSavingsRemaining + unallocated;
  
  const today = new Date();
  const endOfCurMonth = endOfMonth(today);
  const daysRemaining = Math.max(1, differenceInDays(endOfCurMonth, today) + 1); // +1 to include today
  
  const safeToSpend = totalSpendable / daysRemaining;

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="bg-white p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">{formatMonthYear(currentMonthId)}</h1>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {/* Monthly Allowance Card */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-md">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-blue-100 text-sm font-medium">Monthly Allowance</p>
              <p className="text-3xl font-bold">{formatMoney(allowance)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-500/30">
            <div>
              <p className="text-blue-100 text-xs font-medium">Total Spent</p>
              <p className="text-xl font-semibold">{formatMoney(totalSpent)}</p>
            </div>
            <div>
              <p className="text-blue-100 text-xs font-medium">Remaining</p>
              <p className="text-xl font-semibold">{formatMoney(remainingAllowance)}</p>
            </div>
          </div>
        </Card>

        {/* Mini Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gray-50 border border-gray-200">
            <p className="text-gray-500 text-xs font-medium">Unallocated</p>
            <p className="text-lg font-bold text-gray-900">{formatMoney(unallocated)}</p>
          </Card>
          
          <Card className={totalSpendable < 0 ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}>
            <p className={totalSpendable < 0 ? "text-red-600 text-xs font-medium" : "text-emerald-700 text-xs font-medium"}>
              Safe to Spend
            </p>
            {totalSpendable < 0 ? (
              <p className="text-sm font-bold text-red-700 mt-1">Over budget</p>
            ) : (
              <p className="text-lg font-bold text-emerald-800">
                {formatMoney(safeToSpend)} <span className="text-xs font-normal">/day</span>
              </p>
            )}
          </Card>
        </div>

        {/* Category Cards */}
        <div className="mt-2 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Categories</h2>
          
          {categories.map(category => {
            const isSavings = category.isSavings;
            const categoryTransactions = transactions.filter(t => t.categoryId === category.id);
            const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
            const remaining = category.budget - spent;
            const progress = (spent / category.budget) * 100;
            
            const isOverBudget = remaining < 0;
            const variant = isOverBudget ? 'danger' : (progress >= 80 ? 'warning' : 'default');

            if (isSavings) {
              return (
                <Card key={category.id} className="border-l-4 border-l-purple-500">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-800">{category.name} <span className="text-xs text-purple-600 ml-1 font-medium bg-purple-100 px-2 py-0.5 rounded">Savings</span></h3>
                    <p className="font-medium text-gray-600">Target: {formatMoney(category.budget)}</p>
                  </div>
                  <div className="flex justify-between items-end mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Saved</p>
                      <p className="font-semibold text-purple-600">{formatMoney(spent)}</p>
                    </div>
                  </div>
                  <ProgressBar progress={(spent/category.budget)*100} variant="success" />
                </Card>
              );
            }

            return (
              <Card key={category.id}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{category.name}</h3>
                  <p className="font-medium text-gray-500">Budget: {formatMoney(category.budget)}</p>
                </div>
                
                <div className="flex justify-between items-end mt-2 mb-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Spent</p>
                    <p className="font-semibold">{formatMoney(spent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">Remaining</p>
                    <p className={`font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
                      {isOverBudget ? `-RM${Math.abs(remaining).toFixed(2)}` : formatMoney(remaining)}
                    </p>
                  </div>
                </div>

                <ProgressBar progress={progress} variant={variant} />
                
                {isOverBudget && (
                  <p className="text-xs text-red-600 font-medium mt-2">Over Budget by {formatMoney(Math.abs(remaining))}</p>
                )}
                {!isOverBudget && progress >= 80 && progress < 100 && (
                  <p className="text-xs text-yellow-600 font-medium mt-2">{category.name} is {Math.round(progress)}% used</p>
                )}
                {!isOverBudget && progress === 100 && (
                  <p className="text-xs text-yellow-600 font-medium mt-2">{category.name} budget reached</p>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsExpenseModalOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/30 active:bg-blue-700 transition-colors z-40"
      >
        <Plus size={28} />
      </button>

      <ExpenseModal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
      />
    </div>
  );
}

