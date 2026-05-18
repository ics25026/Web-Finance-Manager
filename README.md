# Web Finance Manager

Web Finance Manager (FinTrack) is a lightweight, browser-based personal finance app for tracking income, expenses, budgets, and spending trends. The frontend is built with static HTML, CSS, and JavaScript, with Supabase handling authentication and persisted user data.

## Features

- Email/password sign up and login through Supabase Auth.
- Protected user dashboard that redirects unauthenticated visitors to the login page.
- Income and expense transaction tracking with custom categories.
- Budget creation, update, and deletion by category.
- Dashboard summary cards for current balance, total income, and total expenses.
- Chart.js visualizations for:
  - expenses by category,
  - expenses by month,
  - balance over time.
- Browser `localStorage` fallback/cache for transactions, budgets, and username display.

## Project Structure

```text
Frontend/
├── auth.js        # Shared Supabase client and auth helpers
├── index.html     # Landing page
├── login.html     # Login page
├── login.js       # Login form behavior
├── signup.html    # Account creation page
├── signup.js      # Signup form behavior
├── styles.css     # Shared site and dashboard styles
├── user.html      # Authenticated dashboard page
└── user.js        # Dashboard data loading, rendering, charts, and forms
README.md
```

## Tech Stack

- HTML5
- CSS3
- JavaScript ES modules
- Supabase Auth and Database
- Chart.js
- Browser `localStorage`

## Getting Started

### Prerequisites

- A modern browser with JavaScript enabled.
- A local static file server, such as the VS Code Live Server extension or Python's built-in HTTP server.
- A Supabase project configured with the tables described below.

### Run Locally

1. Clone the repository.
2. Start a static file server from the repository root:

   ```bash
   python3 -m http.server 8000
   ```

3. Open the landing page in your browser:

   ```text
   http://localhost:8000/Frontend/index.html
   ```

4. Create an account from `signup.html`, confirm the email if your Supabase project requires confirmation, then log in from `login.html`.

> Opening the HTML files directly with a `file://` URL may not work reliably because the app uses JavaScript modules and remote CDN imports.

## Supabase Configuration

The Supabase client is currently configured in `Frontend/auth.js` and `Frontend/user.js`. The project uses a public anon/publishable key, which is expected for browser-side Supabase apps. Keep all privileged service-role keys out of frontend code.

### Required Tables

The dashboard expects these database tables and relationships:

#### `categories`

| Column | Suggested type | Notes |
| --- | --- | --- |
| `id` | `uuid` or generated primary key | Referenced by transactions and budgets. |
| `user_id` | `uuid` | Supabase Auth user id. |
| `name` | `text` | Category display name. |
| `type` | `text` | Usually `income` or `expense`. |
| `created_at` | `timestamp with time zone` | Optional but useful for sorting/auditing. |

#### `transactions`

| Column | Suggested type | Notes |
| --- | --- | --- |
| `id` | `uuid` or generated primary key | Transaction id. |
| `user_id` | `uuid` | Supabase Auth user id. |
| `category_id` | same type as `categories.id` | Foreign key to `categories.id`. |
| `name` | `text` | Transaction label. |
| `amount` | `numeric` | Positive amount entered by the user. |
| `type` | `text` | `income` or `expense`. |
| `created_at` | `timestamp with time zone` | Used by charts and ordering. |

#### `budgets`

| Column | Suggested type | Notes |
| --- | --- | --- |
| `id` | `uuid` or generated primary key | Budget id. |
| `user_id` | `uuid` | Supabase Auth user id. |
| `category_id` | same type as `categories.id` | Foreign key to `categories.id`. |
| `amount_limit` | `numeric` | Budget limit for the category. |
| `created_at` | `timestamp with time zone` | Optional but useful for auditing. |

For budget upserts to work, add a unique constraint on `budgets(user_id, category_id)`.

### Security Notes

- Enable Row Level Security (RLS) on each table.
- Add policies so users can only select, insert, update, and delete rows where `user_id = auth.uid()`.
- Do not place Supabase service-role keys or other private secrets in frontend files.

## App Flow

1. Visitors land on `Frontend/index.html` and can navigate to sign up or log in.
2. `Frontend/signup.js` creates a Supabase Auth account and stores the entered username as user metadata.
3. `Frontend/login.js` authenticates existing users and redirects them to `Frontend/user.html`.
4. `Frontend/user.js` checks for an active session, loads user transactions and budgets from Supabase, renders dashboard metrics and charts, and handles transaction and budget form submissions.

## Development Notes

- The frontend imports Supabase and Chart.js from CDNs, so an internet connection is required when running the app.
- There is no build step or package manager configuration in this repository.
- Keep shared authentication changes in `Frontend/auth.js`; dashboard-specific data and rendering logic belongs in `Frontend/user.js`.
- If you add new Supabase tables or columns, update this README and the relevant frontend data-loading code together.

## Troubleshooting

- **Login redirects back to login:** Verify the user has a valid Supabase session and that email confirmation has been completed if required.
- **Dashboard data does not save:** Check Supabase table names, column names, RLS policies, and browser console errors.
- **Charts do not display:** Confirm the Chart.js CDN script is loading and that transaction records include `created_at`, `type`, and `amount` values.
- **Budget upsert fails:** Confirm the unique constraint on `budgets(user_id, category_id)` exists.
