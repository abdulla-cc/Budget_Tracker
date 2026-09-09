import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Category } from '../db';
import { formatMoney, formatMonthYear } from '../utils';
import { useAppMonth } from '../AppContext';
import { Card, ProgressBar } from '../components/ui';
import { Edit2, Plus, Trash2, X } from 'lucide-react';

export function BudgetScreen() {
  const { selectedMonthId: currentMonthId } = useAppMonth();
  
  const currentMonth = useLiveQuery(() => db.months.get(currentMonthId), [currentMonthId]);
  const categories = useLiveQuery(() => db.categories.where('monthId').equals(currentMonthId).toArray(), [currentMonthId]);
  const transactions = useLiveQuery(() => db.transactions.where('monthId').equals(currentMonthId).toArray(), [currentMonthId]);

  const [isEditingAllowance, setIsEditingAllowance] = useState(false);
  const [newAllowance, setNewAllowance] = useState('');

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catBudget, setCatBudget] = useState('');
  const [catIsSavings, setCatIsSavings] = useState(false);

  const [isAddingCategory, setIsAddingCategory] = useState(false);

  if (!currentMonth || !categories || !transactions) return <div className="p-4">Loading...</div>;

  const totalAllocated = categories.reduce((sum, c) => sum + c.budget, 0);
  const unallocated = currentMonth.allowance - totalAllocated;

  const handleUpdateAllowance = async () => {
    const parsed = parseFloat(newAllowance);
    if (!isNaN(parsed) && parsed >= 0) {
      await db.months.update(currentMonthId, { allowance: parsed });
    }
    setIsEditingAllowance(false);
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCatName(c.name);
    setCatBudget(c.budget.toString());
    setCatIsSavings(c.isSavings);
  };

  const handleSaveCategory = async () => {
    const parsedBudget = parseFloat(catBudget);
    if (!catName || isNaN(parsedBudget) || parsedBudget < 0) return;

    if (editingCategory) {
      await db.categories.update(editingCategory.id, {
        name: catName,
        budget: parsedBudget,
        isSavings: catIsSavings
      });
      setEditingCategory(null);
    } else if (isAddingCategory) {
      await db.categories.add({
        id: crypto.randomUUID(),
        monthId: currentMonthId,
        name: catName,
        icon: '',
        budget: parsedBudget,
        isSavings: catIsSavings,
        isDefault: false,
        order: categories.length
      });
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (c: Category) => {
    const hasTransactions = transactions.some(t => t.categoryId === c.id);
    if (hasTransactions) {
      alert("Cannot delete a category that contains expenses. Move them to another category first.");
      return;
    }
    if (window.confirm(`Delete category "${c.name}"?`)) {
      await db.categories.delete(c.id);
    }
  };

  return (
    <div className="pb-24 relative">
      <header className="bg-white p-4 border-b border-gray-100 sticky top-0 z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Budget - {formatMonthYear(currentMonthId)}</h1>
        <button onClick={() => {
          setCatName(''); setCatBudget(''); setCatIsSavings(false); setIsAddingCategory(true);
        }} className="p-2 text-blue-600 bg-blue-50 rounded-full">
          <Plus size={20} />
        </button>
      </header>

      <div className="p-4 flex flex-col gap-6">
        {/* Allowance Header */}
        <Card className="bg-gray-900 text-white border-0 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            {isEditingAllowance ? (
              <div className="flex gap-2 items-center mb-4">
                <input 
                  type="number" 
                  className="bg-white/10 border border-white/20 rounded p-2 text-white w-full font-bold text-xl"
                  value={newAllowance}
                  onChange={e => setNewAllowance(e.target.value)}
                  placeholder={currentMonth.allowance.toString()}
                  autoFocus
                />
                <button onClick={handleUpdateAllowance} className="bg-blue-500 px-4 py-2 rounded font-medium">Save</button>
              </div>
            ) : (
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Monthly Allowance</p>
                  <p className="text-3xl font-bold">{formatMoney(currentMonth.allowance)}</p>
                </div>
                <button onClick={() => { setIsEditingAllowance(true); setNewAllowance(currentMonth.allowance.toString()); }} className="p-2 bg-white/10 rounded-full">
                  <Edit2 size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-800 pt-4">
              <div>
                <p className="text-gray-400 text-xs font-medium">Total Allocated</p>
                <p className="text-lg font-semibold">{formatMoney(totalAllocated)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs font-medium">Unallocated</p>
                <p className="text-lg font-semibold">{formatMoney(unallocated)}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Category List */}
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Categories</h2>
          <div className="flex flex-col gap-3">
            {categories.map(category => {
              const spent = transactions.filter(t => t.categoryId === category.id).reduce((s, t) => s + t.amount, 0);
              const remaining = category.budget - spent;
              const progress = category.budget > 0 ? (spent / category.budget) * 100 : 0;
              
              return (
                <Card key={category.id} className={category.isSavings ? "border-l-4 border-l-purple-500" : ""}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{category.name} {category.isSavings && <span className="text-[10px] uppercase bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded ml-1">Savings</span>}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatMoney(spent)} / {formatMoney(category.budget)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditCategory(category)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteCategory(category)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <ProgressBar progress={progress} variant={remaining < 0 ? 'danger' : 'default'} />
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit/Add Category Modal */}
      {(editingCategory || isAddingCategory) && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl p-4 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h2 className="text-lg font-semibold">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <button onClick={() => { setEditingCategory(null); setIsAddingCategory(false); }} className="p-2"><X size={20}/></button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={e => setCatName(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  placeholder="E.g. Transportation"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget Amount (RM)</label>
                <input 
                  type="number" 
                  value={catBudget} 
                  onChange={e => setCatBudget(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-xl"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  id="isSavings"
                  checked={catIsSavings} 
                  onChange={e => setCatIsSavings(e.target.checked)} 
                  className="w-5 h-5 rounded text-blue-600"
                />
                <label htmlFor="isSavings" className="font-medium text-gray-700 select-none">This is a Savings category</label>
              </div>

              <button 
                onClick={handleSaveCategory}
                className="w-full bg-blue-600 text-white font-semibold p-4 rounded-xl mt-4 active:bg-blue-700"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
