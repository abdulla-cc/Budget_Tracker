import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeMonth } from '../db';
import { formatMonthYear, getCurrentMonthId } from '../utils';
import { useAppMonth } from '../AppContext';
import { Card } from '../components/ui';
import { Calendar, Copy, RotateCcw, AlertTriangle } from 'lucide-react';
import { addMonths, format } from 'date-fns';

export function SettingsScreen() {
  const { selectedMonthId, setSelectedMonthId } = useAppMonth();
  
  const months = useLiveQuery(() => db.months.orderBy('id').reverse().toArray());
  const [isCreatingMonth, setIsCreatingMonth] = useState(false);
  const [newMonthDate, setNewMonthDate] = useState(() => {
    // Default to next month if looking at current calendar month, otherwise current calendar month
    const currentCal = getCurrentMonthId();
    if (selectedMonthId === currentCal) {
      return format(addMonths(new Date(), 1), 'yyyy-MM');
    }
    return currentCal;
  });

  const [copyPrevious, setCopyPrevious] = useState(true);

  if (!months) return <div className="p-4">Loading...</div>;

  const handleCreateMonth = async () => {
    try {
      const copyFromId = copyPrevious ? selectedMonthId : undefined;
      // Get the allowance to copy or default
      let startingAllowance = 733;
      if (copyFromId) {
        const prevMonth = await db.months.get(copyFromId);
        if (prevMonth) startingAllowance = prevMonth.allowance;
      }
      
      await initializeMonth(newMonthDate, startingAllowance, copyFromId);
      setSelectedMonthId(newMonthDate);
      setIsCreatingMonth(false);
    } catch (e) {
      alert("Failed to create month");
    }
  };

  const handleClearData = async () => {
    if (window.confirm("WARNING: This will delete ALL data (all months, expenses, budgets). Are you sure?")) {
      if (window.confirm("Are you REALLY sure? This cannot be undone.")) {
        await db.delete();
        window.location.reload();
      }
    }
  };

  return (
    <div className="pb-24">
      <header className="bg-white p-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
      </header>

      <div className="p-4 flex flex-col gap-6">
        <Card>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar size={16}/> Active Month
          </h2>
          
          <div className="flex flex-col gap-2">
            {months.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedMonthId(m.id)}
                className={`p-3 rounded-xl border text-left flex justify-between items-center transition-colors ${
                  selectedMonthId === m.id 
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold' 
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{formatMonthYear(m.id)}</span>
                {selectedMonthId === m.id && <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Active</span>}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsCreatingMonth(true)}
            className="w-full mt-4 py-3 text-blue-600 font-medium bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
          >
            + Create New Month
          </button>
        </Card>

        <Card className="border-red-100">
          <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle size={16}/> Danger Zone
          </h2>
          <button 
            onClick={handleClearData}
            className="w-full py-3 text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            Clear All App Data
          </button>
        </Card>
      </div>

      {isCreatingMonth && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl p-4 flex flex-col">
            <h2 className="text-lg font-semibold mb-4">Create New Month</h2>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month to Create</label>
                <input 
                  type="month" 
                  value={newMonthDate} 
                  onChange={e => setNewMonthDate(e.target.value)} 
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    checked={copyPrevious} 
                    onChange={() => setCopyPrevious(true)} 
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium flex items-center gap-2"><Copy size={16}/> Copy Current Budget</p>
                    <p className="text-sm text-gray-500">Copies categories and targets from {formatMonthYear(selectedMonthId)}</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <input 
                    type="radio" 
                    checked={!copyPrevious} 
                    onChange={() => setCopyPrevious(false)} 
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium flex items-center gap-2"><RotateCcw size={16}/> Start Fresh</p>
                    <p className="text-sm text-gray-500">Uses default categories (Groceries, etc.)</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => setIsCreatingMonth(false)}
                  className="flex-1 py-3 text-gray-600 bg-gray-100 font-medium rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateMonth}
                  className="flex-1 py-3 text-white bg-blue-600 font-medium rounded-xl active:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

