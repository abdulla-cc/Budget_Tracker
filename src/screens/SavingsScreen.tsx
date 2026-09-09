import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { formatMoney } from '../utils';
import { useAppMonth } from '../AppContext';
import { Card, ProgressBar } from '../components/ui';
import { Plus, X } from 'lucide-react';

export function SavingsScreen() {
  const { selectedMonthId: currentMonthId } = useAppMonth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  const categories = useLiveQuery(() => db.categories.where('monthId').equals(currentMonthId).toArray(), [currentMonthId]);
  const transactions = useLiveQuery(() => db.transactions.where('monthId').equals(currentMonthId).toArray(), [currentMonthId]);

  if (!categories || !transactions) return <div className="p-4">Loading...</div>;

  const savingsCategories = categories.filter(c => c.isSavings);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    
    await db.transactions.add({
      id: crypto.randomUUID(),
      monthId: currentMonthId,
      categoryId,
      amount: parsedAmount,
      date: new Date(date).getTime(),
      note,
      type: 'savings',
      createdAt: Date.now()
    });

    setIsModalOpen(false);
    setAmount('');
    setNote('');
  };

  return (
    <div className="pb-24">
      <header className="bg-purple-600 p-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Savings</h1>
        <button 
          onClick={() => {
            if (savingsCategories.length > 0) setCategoryId(savingsCategories[0].id);
            setIsModalOpen(true);
          }} 
          className="bg-white/20 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1"
        >
          <Plus size={16}/> Add Savings
        </button>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {savingsCategories.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">No savings categories found. Create one in Budget setup.</p>
        ) : (
          savingsCategories.map(category => {
            const catTransactions = transactions.filter(t => t.categoryId === category.id && t.type === 'savings');
            const saved = catTransactions.reduce((sum, t) => sum + t.amount, 0);
            const target = category.budget;
            const progress = target > 0 ? (saved / target) * 100 : 0;

            return (
              <Card key={category.id} className="border-t-4 border-t-purple-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
                    <p className="text-gray-500 text-sm mt-0.5">Monthly Target: {formatMoney(target)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Saved so far</p>
                    <p className="text-2xl font-bold text-purple-700">{formatMoney(saved)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-gray-500 mb-0.5">Progress</p>
                    <p className="text-sm font-bold text-gray-700">{Math.round(progress)}%</p>
                  </div>
                </div>

                <ProgressBar progress={progress} variant="success" />

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Contributions</p>
                  {catTransactions.length === 0 ? (
                    <p className="text-sm text-gray-500">No contributions yet this month.</p>
                  ) : (
                    catTransactions.slice(-3).reverse().map(t => (
                      <div key={t.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">{new Date(t.date).toLocaleDateString()} {t.note && `- ${t.note}`}</span>
                        <span className="font-medium text-purple-600">+{formatMoney(t.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl p-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-lg font-semibold text-purple-700">Add Savings</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM)</label>
                <input 
                  type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} 
                  className="w-full text-3xl font-bold p-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-purple-700"
                  placeholder="0.00" autoFocus required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  value={categoryId} 
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  required
                >
                  {savingsCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" value={date} onChange={e => setDate(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-xl" required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                <input 
                  type="text" value={note} onChange={e => setNote(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-xl" placeholder="Salary transfer, etc."
                />
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white font-semibold p-4 rounded-xl mt-4 active:bg-purple-700">
                Save Contribution
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
