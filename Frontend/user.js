const session = requireAuthOrRedirect();
if (!session) {
  throw new Error('Unauthorized');
}

const state = {
  username: localStorage.getItem('fintrack_username') || 'User',
  transactions: JSON.parse(localStorage.getItem('fintrack_transactions') || '[]'),
  budgets: JSON.parse(localStorage.getItem('fintrack_budgets') || '[]')
};

const displayUsername = document.getElementById('display-username');
const balanceValue = document.getElementById('balance-value');
const incomeValue = document.getElementById('income-value');
const expenseValue = document.getElementById('expense-value');
const transactionForm = document.getElementById('transaction-form');
const budgetForm = document.getElementById('budget-form');
const transactionList = document.getElementById('transaction-list');
const budgetList = document.getElementById('budget-list');

function currency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function save() {
  localStorage.setItem('fintrack_transactions', JSON.stringify(state.transactions));
  localStorage.setItem('fintrack_budgets', JSON.stringify(state.budgets));
}

function renderOverview() {
  const income = state.transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const expense = state.transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const balance = income - expense;

  balanceValue.textContent = currency(balance);
  incomeValue.textContent = currency(income);
  expenseValue.textContent = currency(expense);
}

function renderTransactions() {
  transactionList.innerHTML = '';

  if (state.transactions.length === 0) {
    transactionList.innerHTML = '<p class="small-note">No transactions yet.</p>';
    return;
  }

  [...state.transactions].reverse().forEach((item) => {
    const row = document.createElement('article');
    row.className = 'list-row';
    row.innerHTML = `
      <div>
        <h3>${item.name}</h3>
        <p>${item.category}</p>
      </div>
      <strong class="${item.type === 'income' ? 'income' : 'expense'}">${item.type === 'income' ? '+' : '-'}${currency(item.amount)}</strong>
    `;
    transactionList.appendChild(row);
  });
}

function renderBudgets() {
  budgetList.innerHTML = '';

  if (state.budgets.length === 0) {
    budgetList.innerHTML = '<p class="small-note">No budgets configured yet.</p>';
    return;
  }

  state.budgets.forEach((budget) => {
    const spent = state.transactions
      .filter((item) => item.type === 'expense' && item.category.toLowerCase() === budget.category.toLowerCase())
      .reduce((sum, item) => sum + item.amount, 0);

    const remaining = budget.limit - spent;
    const row = document.createElement('article');
    row.className = 'list-row';
    row.innerHTML = `
      <div>
        <h3>${budget.category}</h3>
        <p>Limit: ${currency(budget.limit)} | Spent: ${currency(spent)}</p>
      </div>
      <strong class="${remaining < 0 ? 'expense' : 'income'}">${remaining < 0 ? 'Over by' : 'Left'} ${currency(Math.abs(remaining))}</strong>
    `;
    budgetList.appendChild(row);
  });
}

transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const trigger = event.submitter?.dataset?.type || 'expense';
  const name = document.getElementById('transaction-name').value.trim();
  const amount = Number(document.getElementById('transaction-amount').value);
  const category = document.getElementById('transaction-category').value.trim();

  if (!name || !category || Number.isNaN(amount) || amount <= 0) {
    return;
  }

  state.transactions.push({ name, amount, category, type: trigger, createdAt: Date.now() });
  transactionForm.reset();
  save();
  renderOverview();
  renderTransactions();
  renderBudgets();
});

budgetForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const category = document.getElementById('budget-category').value.trim();
  const limit = Number(document.getElementById('budget-limit').value);

  if (!category || Number.isNaN(limit) || limit <= 0) {
    return;
  }

  const existing = state.budgets.find((item) => item.category.toLowerCase() === category.toLowerCase());
  if (existing) {
    existing.limit = limit;
  } else {
    state.budgets.push({ category, limit });
  }

  budgetForm.reset();
  save();
  renderBudgets();
});

displayUsername.textContent = state.username;
renderOverview();
renderTransactions();
renderBudgets();
