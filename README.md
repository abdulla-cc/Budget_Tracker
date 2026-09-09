# 💰 Budget Tracker

> A personal allowance & spending tracker built to fix a real budgeting problem.

![Budget Tracker](https://img.shields.io/badge/Built%20with-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)
![PWA](https://img.shields.io/badge/PWA-Installable-5A0FC8?style=flat-square&logo=pwa)
![Offline](https://img.shields.io/badge/Works-Offline-green?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 📖 The Story — Why I Built This

Every month I receive my allowance and within two weeks it's gone. I never knew exactly where it went. I'd check my wallet and think *"I'm sure I had more than this"* — but I had no record, no breakdown, no way to trace it.

I tried spreadsheets. Too tedious. I tried generic budgeting apps. They were either overly complicated, required an account, connected to a bank, or were built for Western currencies without simple RM (Malaysian Ringgit) support.

What I actually needed was something dead simple:

**You receive your monthly allowance → you split it into categories → every time you spend, you pick a category → the app shows you exactly what's left.**

No bank syncing. No subscriptions. No unnecessary features. Just a clean tool that tells you *"you have RM X left for groceries this month"* the moment you log a purchase.

So I built it myself.

---

## ✨ Features

### 💸 Allowance & Category Budgeting
- Set your monthly allowance (any amount you receive)
- Distribute it into spending categories however you like
- The app shows you exactly how much of each category remains at all times

For example, if your allowance is **RM1,000** you could split it like:

| Category | Budget |
|---|---:|
| Groceries | RM350.00 |
| Eating Out | RM150.00 |
| Transport | RM100.00 |
| Bills | RM50.00 |
| Emergency Fund | RM150.00 |
| Savings | RM200.00 |
| **Total Allocated** | **RM1,000.00** |

You decide the categories and amounts — the app adapts to your life.

### ⚡ Instant Deduction
The core feature: the moment you log a purchase, the app deducts it from the correct category. No manual math needed.

```
Groceries budget:  RM350
You spent:         RM45
Remaining:         RM305  ← updates instantly
```

### 📊 Smart Dashboard
- **Monthly Allowance** card — total, spent, remaining
- **Safe to Spend Today** — calculates how much you can spend per day for the rest of the month
- **Category progress bars** — visual indicator of how close each category is to its limit
- **Unallocated money** — money in your allowance not yet assigned to any category
- **Over-budget warnings** — clearly highlighted when you exceed a category

### 📅 Multi-Month Support
- Every month has its own independent data
- Switch between months in Settings
- Create a new month by copying last month's budget or starting fresh
- Past months are never overwritten

### ✏️ Full Expense Editing
- Edit the amount of any expense
- Move an expense to a different category
- Delete an expense — all balances recalculate automatically

### 🐷 Savings Tracking
- Mark categories as "Savings" (e.g. Emergency Fund, Fun Money)
- Track contributions separately from ordinary expenses
- Savings are excluded from the "Safe to Spend" calculation

### 📱 Installable on Your Phone (PWA)
Works as a Progressive Web App — install it on your phone's home screen from your browser. No App Store needed. Works completely offline after the first load.

---

## 🏗️ Tech Stack

| Technology | Purpose |
|---|---|
| [React](https://react.dev/) + [Vite](https://vitejs.dev/) | UI framework & build tool |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Dexie.js](https://dexie.org/) (IndexedDB) | Local offline database |
| [React Router](https://reactrouter.com/) | Navigation |
| [Lucide React](https://lucide.dev/) | Icons |
| [date-fns](https://date-fns.org/) | Date utilities |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | PWA / installability |

### Why Dexie.js?
All data is stored locally on your device using IndexedDB (via Dexie.js). This means:
- **No account required** — your data stays on your phone
- **Full offline support** — works with no internet after first load
- **Transaction history is the source of truth** — balances are never stored directly; they are always calculated from actual expense records. Editing or deleting an expense automatically corrects every balance.

---

## 🚀 Running Locally

```bash
# Clone the repo
git clone https://github.com/abdulla-cc/Budget_Tracker.git
cd Budget_Tracker

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

```bash
npm run build
```

The output will be in the `dist/` folder. You can host this on any static hosting service.

### Easiest Deployment: Netlify Drop
1. Run `npm run build`
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag and drop the `dist` folder into the page
4. Get an instant public URL — no account needed
5. Open the URL on your phone and tap **"Add to Home Screen"**

---

## 📱 Installing on Your Phone

### iPhone (Safari)
1. Open the app URL in Safari
2. Tap the **Share** button → **Add to Home Screen**
3. Tap **Add**

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the **three dots** → **Install app** or **Add to Home Screen**

Once installed, the app runs fullscreen like a native app and works completely offline.

---

## 🧪 How the Math Works

The app never stores a "remaining" value in the database. Every balance is **always calculated live** from raw transactions:

```
Category Remaining  = Category Budget - SUM(expenses in that category)
Total Spent         = SUM(all expenses this month)
Remaining Allowance = Monthly Allowance - Total Spent
Unallocated         = Monthly Allowance - SUM(all category budgets)
Safe to Spend/Day   = Remaining Spendable / Days Left in Month
```

This design means editing or deleting any transaction automatically corrects every single number on screen — no sync required, no stale data possible.

---

## 📁 Project Structure

```
src/
├── db.ts                 # Dexie database schema & seed data
├── utils.ts              # Money formatting, month helpers
├── AppContext.tsx         # Selected month context
├── App.tsx               # Router setup
├── components/
│   ├── Layout.tsx        # Bottom navigation shell
│   ├── ExpenseModal.tsx  # Add/Edit expense modal
│   └── ui.tsx            # Card, ProgressBar components
└── screens/
    ├── HomeScreen.tsx     # Dashboard
    ├── BudgetScreen.tsx   # Category budgets
    ├── ExpensesScreen.tsx # Expense history
    ├── SavingsScreen.tsx  # Savings tracker
    └── SettingsScreen.tsx # Month management
```

---

## 📌 Planned Improvements

- [ ] Export expenses to CSV
- [ ] Recurring expenses
- [ ] Custom category icons
- [ ] Dark mode
- [ ] Monthly summary/report view

---

## 📄 License

MIT — free to use, modify, and share.

---

*Built to solve a real problem. If you've ever lost track of where your monthly allowance went, this app might help.*
