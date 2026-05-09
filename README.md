# Web-Finance-Manager

A lightweight web-based app for tracking expenses, managing budgets, and visualizing personal finances.

## Frontend Pages
- `Frontend/index.html` — landing page.
- `Frontend/signup.html` — sign-up page.
- `Frontend/login.html` — login page.
- `Frontend/user.html` — user dashboard with transaction and budget management.

## Dashboard Features
- Income and expense transaction tracking by category.
- Real-time balance, monthly income, and monthly expense metrics.
- Budget planning per category with over/under-limit indicators.
- Data persistence with browser `localStorage`.

## Supabase Authentication Setup
This project now includes browser-side Supabase auth using:
- `POST /auth/v1/signup` for account creation.
- `POST /auth/v1/token?grant_type=password` for login.
- `POST/GET /rest/v1/profiles` for user profile writes/reads.

Before login/signup works, update `Frontend/auth.js` and set:
- `SUPABASE_ANON_KEY` to your Supabase project's anon/public key.

You should also create a `profiles` table in Supabase with columns:
- `id` (`uuid`, primary key, usually references `auth.users.id`)
- `email` (`text`)
- `username` (`text`)

And configure RLS policies so authenticated users can insert/select their own row.
