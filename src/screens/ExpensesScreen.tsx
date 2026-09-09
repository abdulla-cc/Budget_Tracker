import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../db';
import { formatMoney } from '../utils';
import { useAppMonth } from '../AppContext';
import { format, isToday, isYesterday } from 'date-fns';
import { ExpenseModal } from '../components/ExpenseModal';
import { Trash2 } from 'lucide-react';

export function ExpensesScreen() {
  const { selectedMonthId: currentMonthId } = useAppMonth();
  const [expenseToEdit, setExpenseToEdit] = useState<Transaction | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const transactions = useLiveQuery(() => 
    db.transactions.where('monthId').equals(currentMonthId).reverse().sortBy('date'),
    [currentMonthId]
  );
  
  const categories = useLiveQuery(() => 
    db.categories.where('monthId').equals(currentMonthId).toArray(),
    [currentMonthId]
  );

  if (!transactions || !categories) return <div className="p-4">Loading...</div>;

  const expenses = transactions.filter(t => t.type === 'expense');

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  expenses.forEach(t => {
    const d = new Date(t.date);
    let key = format(d, 'MMM d, yyyy');
    if (isToday(d)) key = 'Today';
    else if (isYesterday(d)) key = 'Yesterday';
    
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(t);
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this expense?")) {
      await db.transactions.delete(id);
      if (expenseToEdit?.id === id) {
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="pb-24">
      <header className="bg-white p-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Expenses</h1>
      </header>

      {expenses.length === 0 ? (
        <div className="p-8 text-center mt-10">
          <p className="text-gray-500 font-medium">No expenses yet</p>
          <p className="text-sm text-gray-400 mt-2">Tap + on Home to add your first expense.</p>
        </div>
      ) : (
        <div className="p-4 flex flex-col gap-6">
          {Object.entries(grouped).map(([dateStr, items]) => (
            <div key={dateStr}>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{dateStr}</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
                {items.map(expense => {
                  const category = categories.find(c => c.id === expense.categoryId);
                  return (
                    <div 
                      key={expense.id} 
                      className="p-4 flex justify-between items-center active:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setExpenseToEdit(expense);
                        setIsModalOpen(true);
                      }}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{formatMoney(expense.amount)}</p>
                        <p className="text-sm text-gray-500 font-medium mt-0.5">{category?.name || 'Unknown'}</p>
                        {expense.note && <p className="text-xs text-gray-400 mt-1">{expense.note}</p>}
                      </div>
                      <button 
                        onClick={(e) => handleDelete(expense.id, e)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <ExpenseModal 
        isOpen={isModalOpen}
        expenseToEdit={expenseToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setTimeout(() => setExpenseToEdit(undefined), 300); // clear after close animation
        }}
      />
    </div>
  );
}

