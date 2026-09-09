import { useState, useEffect } from 'react';
import { db } from '../db';
import type { Category, Transaction } from '../db';
import { useAppMonth } from '../AppContext';
import { X } from 'lucide-react';

export function ExpenseModal({
  isOpen,
  onClose,
  expenseToEdit,
}: {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Transaction;
}) {
  const { selectedMonthId } = useAppMonth();
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (isOpen) {
      const monthId = expenseToEdit?.monthId || selectedMonthId;
      db.categories.where('monthId').equals(monthId).toArray().then(cats => {
        const expenseCats = cats.filter(c => !c.isSavings);
        setCategories(expenseCats);
        if (!expenseToEdit && expenseCats.length > 0) {
          setCategoryId(expenseCats[0].id);
        }
      });

      if (expenseToEdit) {
        setAmount(expenseToEdit.amount.toString());
        setCategoryId(expenseToEdit.categoryId);
        setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
        setNote(expenseToEdit.note || '');
      } else {
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
    }
  }, [isOpen, expenseToEdit, selectedMonthId]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const monthId = expenseToEdit?.monthId || selectedMonthId;
    const parsedDate = new Date(date).getTime();

    if (expenseToEdit) {
      await db.transactions.update(expenseToEdit.id, {
        amount: parsedAmount,
        categoryId,
        date: parsedDate,
        note,
      });
    } else {
      await db.transactions.add({
        id: crypto.randomUUID(),
        monthId,
        categoryId,
        amount: parsedAmount,
        date: parsedDate,
        note,
        type: 'expense',
        createdAt: Date.now(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div className="bg-white w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">{expenseToEdit ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-4 overflow-y-auto flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-3xl font-bold p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={`p-3 text-sm rounded-xl border text-left transition-colors ${
                    categoryId === c.id 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' 
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Lunch, Grocery, etc."
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold p-4 rounded-xl mt-4 active:bg-blue-700"
          >
            Save Expense
          </button>
        </form>
      </div>
    </div>
  );
}
