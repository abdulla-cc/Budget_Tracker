import Dexie, { type EntityTable } from 'dexie';

export interface Month {
  id: string; // Format: "YYYY-MM"
  allowance: number;
  createdAt: number;
}

export interface Category {
  id: string;
  monthId: string;
  name: string;
  icon: string;
  budget: number;
  isSavings: boolean;
  isDefault: boolean;
  order: number;
}

export interface Transaction {
  id: string;
  monthId: string;
  categoryId: string;
  amount: number;
  date: number;
  note: string;
  type: 'expense' | 'savings';
  createdAt: number;
}

export const db = new Dexie('BudgetAppDB') as Dexie & {
  months: EntityTable<Month, 'id'>;
  categories: EntityTable<Category, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
};

// Schema declaration
db.version(1).stores({
  months: 'id, createdAt',
  categories: 'id, monthId, isSavings, order',
  transactions: 'id, monthId, categoryId, date, type, createdAt'
});

// Helper for generating initial default categories
export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', budget: 280, isSavings: false },
  { name: 'Eating Out', budget: 120, isSavings: false },
  { name: 'Phone / Other Bills', budget: 30, isSavings: false },
  { name: 'Emergency Fund', budget: 100, isSavings: true },
  { name: 'Buffer / Fun / Savings', budget: 123, isSavings: true },
];

export async function initializeMonth(monthId: string, allowance: number = 733, copyFromMonthId?: string) {
  const existingMonth = await db.months.get(monthId);
  if (existingMonth) return;

  await db.transaction('rw', db.months, db.categories, async () => {
    // 1. Create the month
    await db.months.add({
      id: monthId,
      allowance,
      createdAt: Date.now()
    });

    // 2. Create categories
    if (copyFromMonthId) {
      const prevCategories = await db.categories.where('monthId').equals(copyFromMonthId).toArray();
      if (prevCategories.length > 0) {
        const newCats = prevCategories.map(c => ({
          ...c,
          id: crypto.randomUUID(),
          monthId
        }));
        await db.categories.bulkAdd(newCats);
        return;
      }
    }

    // Default categories if no copy or copy was empty
    const defaultCats: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({
      id: crypto.randomUUID(),
      monthId,
      name: c.name,
      icon: '',
      budget: c.budget,
      isSavings: c.isSavings,
      isDefault: true,
      order: i
    }));
    await db.categories.bulkAdd(defaultCats);
  });
}
