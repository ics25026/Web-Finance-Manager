import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ---------------- SUPABASE ---------------- */
const SUPABASE_URL = 'https://mzysoyzojevfiiofjump.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_sxyEvrmij9RoeeorMzZQEg_rc_7t21B';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------------- AUTH CHECK ---------------- */
const {
  data: { session }
} = await supabase.auth.getSession();

if (!session) {
  window.location.href = "login.html";
  throw new Error("Unauthorized");
}

const {
  data: { user },
  error: userError
} = await supabase.auth.getUser();

if (userError || !user) {
  window.location.href = "login.html";
  throw new Error("Unauthorized");
}

/* ---------------- USERNAME ---------------- */
let username = "User";

if (user) {
  username =
    user.user_metadata?.full_name ||
    user.user_metadata?.username ||
    user.email?.split("@")[0] ||
    "User";

  localStorage.setItem("fintrack_username", username);
}

/* ---------------- TRANSACTIONS ---------------- */
let transactions = [];

if (user) {
  const { data, error } = await supabase
  .from("transactions")
  .select(`
    *,
    categories(name)
  `)
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

  if (!error && data) {
    transactions = data;
    localStorage.setItem(
      "fintrack_transactions",
      JSON.stringify(transactions)
    );
  } else {
    transactions = JSON.parse(
      localStorage.getItem("fintrack_transactions") || "[]"
    );
  }
} else {
  transactions = JSON.parse(
    localStorage.getItem("fintrack_transactions") || "[]"
  );
}

/* ---------------- BUDGETS ---------------- */
let budgets = [];

if (user) {
  const { data, error } = await supabase
    .from("budgets")
    .select(`
      *,
      categories(name)
    `)
    .eq("user_id", user.id);

  if (!error && data) {
    budgets = data;
    localStorage.setItem(
      "fintrack_budgets",
      JSON.stringify(budgets)
    );
  } else {
    budgets = JSON.parse(
      localStorage.getItem("fintrack_budgets") || "[]"
    );
  }
} else {
  budgets = JSON.parse(
    localStorage.getItem("fintrack_budgets") || "[]"
  );
}

/* ---------------- recurringPayments ---------------- */

let recurringPayments = [];
if (user) {

  const { data, error } = await supabase
    .from("recurring_payments")
    .select(`
      *,
      categories(name)
    `)
    .eq("user_id", user.id);

  if (!error && data) {
    recurringPayments = data;
  }
} 

/* ---------------- FINAL STATE ---------------- */
const state = {
  username,
  transactions,
  budgets,
  recurringPayments
};


const displayUsername = document.getElementById('display-username');

const balanceValue = document.getElementById('balance-value');
const incomeValue = document.getElementById('income-value');
const expenseValue = document.getElementById('expense-value');

const transactionForm = document.getElementById('transaction-form');
const budgetForm = document.getElementById('budget-form');
const recurringForm = document.getElementById("recurring-form");

const transactionList = document.getElementById('transaction-list');
const budgetList = document.getElementById('budget-list');
const recurringList = document.getElementById("recurring-list");

/* ---------------- CHARTS ---------------- */

const expenseCategoryChartCanvas = document.getElementById(
  "expense-category-chart"
);

const monthlyExpenseChartCanvas = document.getElementById(
  "monthly-expense-chart"
);

const balanceChartCanvas = document.getElementById(
  "balance-chart"
);
/* ---------------- CHART INSTANCES ---------------- */

let expenseCategoryChart;
let monthlyExpenseChart;
let balanceChart;

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
        <p>${item.categories?.name || 'Unknown Category'}</p>
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
    const categoryName = budget.categories?.name || 'Unknown';

    const spent = state.transactions
      .filter((item) =>
        item.type === 'expense' &&
        item.categories?.name?.toLowerCase() === categoryName.toLowerCase()
      )
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const limit = Number(budget.amount_limit);

    const remaining = limit - spent;

    const row = document.createElement('article');
    row.className = 'list-row';

    row.innerHTML = `
      <div>
        <h3>${categoryName}</h3>
        <p>Limit: ${currency(limit)} | Spent: ${currency(spent)}</p>
      </div>
      <div id = "bdgbtn">
        <strong class="${remaining < 0 ? 'expense' : 'income'}">
        ${remaining < 0 ? 'Over by' : 'Left'} ${currency(Math.abs(remaining))}
        </strong>
        <button class="delete-btn" data-category-id="${budget.category_id}">Delete</button>
      </div>
    `;

    budgetList.appendChild(row);
  });
}
function renderCharts() {

  /* =========================
     DESTROY OLD CHARTS
  ========================= */

  if (expenseCategoryChart) expenseCategoryChart.destroy();
  if (monthlyExpenseChart) monthlyExpenseChart.destroy();
  if (balanceChart) balanceChart.destroy();

  /* =========================
     PIE CHART
     Expenses by Category
  ========================= */

  const expenses = state.transactions.filter(
    t => t.type === "expense"
  );

  const categoryTotals = {};

  expenses.forEach(transaction => {
    const category =
      transaction.categories?.name || "Unknown";

    categoryTotals[category] =
      (categoryTotals[category] || 0) +
      Number(transaction.amount);
  });

  expenseCategoryChart = new Chart(
    expenseCategoryChartCanvas,
    {
      type: "pie",
      data: {
        labels: Object.keys(categoryTotals),
        datasets: [
          {
            data: Object.values(categoryTotals)
          }
        ]
      },
      
    }
  );


  /* =========================
     BAR CHART
     Expenses by Month
  ========================= */

  const monthlyTotals = {};

  expenses.forEach(transaction => {

    const date = new Date(
      transaction.transaction_date
    );

    const month =
      date.toLocaleString("en-US", {
        month: "short"
      });

    monthlyTotals[month] =
      (monthlyTotals[month] || 0) +
      Number(transaction.amount);
  });

  monthlyExpenseChart = new Chart(
    monthlyExpenseChartCanvas,
    {
      type: "bar",
      data: {
        labels: Object.keys(monthlyTotals),
        datasets: [
          {
            label: "Expenses",
            data: Object.values(monthlyTotals)
          }
        ]
      },
      options: {
    responsive: true,
    maintainAspectRatio: false
      }
    }
  );

  /* =========================
     LINE CHART
     Balance Over Time
  ========================= */

  const sortedTransactions =
    [...state.transactions].sort(
      (a, b) =>
        new Date(a.created_at) -
        new Date(b.created_at)
    );

  let runningBalance = 0;

  const balanceLabels = [];
  const balanceData = [];

  sortedTransactions.forEach(transaction => {

    if (transaction.type === "income") {
      runningBalance += Number(transaction.amount);
    } else {
      runningBalance -= Number(transaction.amount);
    }

    const date = new Date(
      transaction.created_at
    );

    balanceLabels.push(
      date.toLocaleDateString()
    );

    balanceData.push(runningBalance);
  });

  balanceChart = new Chart(
    balanceChartCanvas,
    {
      type: "line",
      data: {
        labels: balanceLabels,
        datasets: [
          {
            label: "Balance",
            data: balanceData,
            tension: 0.3
          }
        ]
      },
      options: {
    responsive: true,
    maintainAspectRatio: false
      }
    }
  );
}


function renderRecurringPayments() {

  recurringList.innerHTML = "";

  if (recurringPayments.length === 0) {
    recurringList.innerHTML =
      '<p class="small-note">No recurring payments yet.</p>';
    return;
  }

  recurringPayments.forEach(payment => {
    const row =
      document.createElement("article");

    row.className = "list-row";

    row.innerHTML = `
      <div>
        <h3>${payment.title}</h3>

        <p>
          ${payment.categories?.name || "Unknown"}
          •
          ${payment.frequency}
        </p>
      </div>

      <strong class="expense">
        ${currency(payment.amount)}
      </strong>
    `;

    recurringList.appendChild(row);
  });
}

transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const trigger =
    event.submitter?.dataset?.type || "expense";

  const name = document
    .getElementById("transaction-name")
    .value.trim();

  const amount = Number(
    document.getElementById("transaction-amount").value
  );

  const categoryName = document
    .getElementById("transaction-category")
    .value.trim();

  if (!name || !categoryName || amount <= 0) return;

  let categoryId = null;

  /* -----------------------------------
     1. SEARCH EXISTING CATEGORY
  ----------------------------------- */

  const { data: existingCategory } = await supabase
    .from("categories")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", categoryName)
    .limit(1)
    .maybeSingle();

  if (existingCategory) {
    categoryId = existingCategory.id;
  } else {
    /* -----------------------------------
       2. CREATE NEW CATEGORY
    ----------------------------------- */

    const { data: newCategory, error } =
      await supabase
        .from("categories")
        .insert([
          {
            user_id: user.id,
            name: categoryName,
            type: trigger
          }
        ])
        .select()
        .single();

    if (error) {
      alert("Failed creating category");
      return;
    }

    categoryId = newCategory.id;
  }

  /* -----------------------------------
     3. INSERT TRANSACTION
  ----------------------------------- */

  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        user_id: user.id,
        name,
        amount,
        type: trigger,
        category_id: categoryId
      }
    ])
    .select(`
      *,
      categories(name)
    `)
    .single();

  if (error) {
    alert("Failed saving transaction");
    return;
  }

  state.transactions.push(data);

  transactionForm.reset();

  renderOverview();
  renderTransactions();
  renderBudgets();
  renderCharts();
});

budgetForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const categoryName = document
    .getElementById("budget-category")
    .value
    .trim();

  const amount = Number(
    document.getElementById("budget-limit").value
  );

  if (!categoryName || !amount) return;

  let categoryId;

  /* ---------------- FIND CATEGORY ---------------- */
  let { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,name")
    .eq("user_id", user.id)
    .ilike("name", categoryName)
    .maybeSingle();

  if (categoryError) {
    console.log(categoryError);
    return;
  }

  /* ---------------- CREATE CATEGORY IF NOT EXISTS ---------------- */
  if (!category) {
    const { data: newCategory, error: createError } = await supabase
      .from("categories")
      .insert([
        {
          user_id: user.id,
          name: categoryName,
          type: "expense"
        }
      ])
      .select()
      .single();

    if (createError) {
      console.log(createError);
      return;
    }

    category = newCategory;
  }

  categoryId = category.id;

  /* ---------------- UPSERT BUDGET ---------------- */
  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category_id: categoryId,
        amount_limit: amount
      },
      {
        onConflict: "user_id,category_id"
      }
    )
    .select(`
      *,
      categories(name)
    `)
    .single();

  if (error) {
    console.log(error);
    return;
  }

  /* ---------------- UPDATE STATE ---------------- */
  const index = state.budgets.findIndex(
    (b) => b.category_id === data.category_id
  );

  if (index >= 0) {
    state.budgets[index] = data;
  } else {
    state.budgets.push(data);
  }

  /* ---------------- RENDER ---------------- */
  renderBudgets();
  save();
  budgetForm.reset();
});

budgetList.addEventListener("click", async (e) => {
  e.preventDefault();
  if (!e.target.classList.contains("delete-btn")) return;
  
  const categoryId = e.target.dataset.categoryId;
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("user_id", user.id)
    .eq("category_id", categoryId); 

  if (error) {
    console.log(error);
    return;
  }

state.budgets = state.budgets.filter(
  b => b.category_id !== categoryId
);
  save();
  budgetForm.reset();
  renderBudgets();
  renderCharts();

});

recurringForm.addEventListener("submit",async (e) => {
    e.preventDefault();

    const title =
      document
        .getElementById("recurring-title")
        .value
        .trim();

    const amount = Number(
      document
        .getElementById("recurring-amount")
        .value
    );

    const categoryName =
      document
        .getElementById("recurring-category")
        .value
        .trim();

    const frequency =
      document
        .getElementById("recurring-frequency")
        .value;

    if (!title || !amount || !categoryName)
      return;

    let categoryId;

    /* FIND CATEGORY */

    let { data: category } =
      await supabase
        .from("categories")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", categoryName)
        .maybeSingle();

    /* CREATE CATEGORY */

    if (!category) {

      const {
        data: newCategory
      } = await supabase
        .from("categories")
        .insert([
          {
            user_id: user.id,
            name: categoryName,
            type: "expense"
          }
        ])
        .select()
        .single();

      category = newCategory;
    }

    categoryId = category.id;

    /* INSERT PAYMENT */

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    const { data, error } =
      await supabase
        .from("recurring_payments")
        .insert([
          {
            user_id: user.id,
            category_id: categoryId,
            title,
            amount,
            frequency,
            next_due_date: today
          }
        ])
        .select(`
          *,
          categories(name)
        `)
        .single();

    if (error) {
      console.log(error);
      return;
    }

    recurringPayments.push(data);
    renderRecurringPayments();
    processRecurringPayments();
    recurringForm.reset();
  }
);
async function processRecurringPayments() {

  const today =
    new Date()
      .toISOString()
      .split("T")[0];

  for (const payment of recurringPayments) {

    if (
      payment.active &&
      payment.next_due_date <= today
    ) {

      /* CREATE TRANSACTION */

      await supabase
        .from("transactions")
        .insert([
          {
            user_id: user.id,
            name: payment.title,
            amount: payment.amount,
            type: "expense",
            category_id:
              payment.category_id
          }
        ]);

      /* NEXT DATE */

      const next =
        new Date(payment.next_due_date);

      if (payment.frequency === "monthly") {
        next.setMonth(next.getMonth() + 1);
      }

      if (payment.frequency === "weekly") {
        next.setDate(next.getDate() + 7);
      }

      if (payment.frequency === "yearly") {
        next.setFullYear(next.getFullYear() + 1);
      }

      await supabase
        .from("recurring_payments")
        .update({
          next_due_date:
            next
              .toISOString()
              .split("T")[0]
        })
        .eq("id", payment.id);
    }
  }
}



displayUsername.textContent = state.username;
renderOverview();
renderTransactions();
renderBudgets();
renderCharts();
await processRecurringPayments();
renderRecurringPayments();