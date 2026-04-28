# Frontend pages

Brief reference for each route: purpose, what it shows, and API data sources.

## Shared technical context

- **Stack:** React, Vite, React Router, TanStack React Query, Zustand (auth, theme), Axios (`src/lib/api.ts`).
- **API base:** `VITE_API_BASE_URL` or `http://localhost:3000/api`. Requests include `Authorization: Bearer <token>` from `localStorage` when present; **401** clears the token and redirects to `/login`.
- **Auth API:** `POST /auth/login`, `POST /auth/telegram`, `GET /auth/me`, `POST /auth/logout` — see `src/stores/auth.store.ts`.
- **Shell:** Authenticated routes use `ProtectedRoute` + `AppLayout` (navigation, profile loaded via `fetchProfile`).

---

## `/login` — `LoginPage`

| | |
|---|---|
| **Purpose** | Sign in with username/password, or automatically via Telegram Web App `initData` when opened inside Telegram. |
| **Shows** | Login form, theme toggle, error states. |
| **Data** | `useAuthStore().login` → `POST /auth/login`; `loginWithTelegram` → `POST /auth/telegram`. Redirects to `/` on success. |

---

## `/` (index) — `DashboardPage`

| | |
|---|---|
| **Purpose** | High-level P&amp;L-style summary for a date range and client scope (single client or all active clients). |
| **Shows** | Date range picker, client filter, KPI cards (WB income/expenses, extra expenses, revenue), WB fee breakdown, comparison of WB data vs internal expense totals. |
| **Data** | `GET /clients` (active clients only for aggregations); `GET /wb/report/:id?dateFrom&dateTo` (parallel per client when “all”, then merged); `GET /expenses/summary?clientId&dateFrom&dateTo` (parallel / merged for “all”). |

---

## `/clients` — `ClientsPage`

| | |
|---|---|
| **Purpose** | List and CRUD Wildberries client accounts (cabinet / API connection). |
| **Shows** | Table (name, currency, last sync, status, etc.), create/edit/delete dialogs; navigation to client detail. Admins get full CRUD; viewers are read-oriented. |
| **Data** | `GET /clients`; `POST /clients`; `PATCH /clients/:id`; `DELETE /clients/:id`. |

---

## `/clients/:id` — `ClientDetailPage`

| | |
|---|---|
| **Purpose** | Deep dive for one client: sales, WB report, balance, extra expenses, charts. |
| **Shows** | Client header, date range, summary cards, WB breakdown, balance history, expense pie, composed charts. |
| **Data** | `GET /clients/:id`; `GET /wb/report/:id?dateFrom&dateTo`; `GET /wb/balance/:id`; `GET /wb/balance/:id/history?days=30`; `GET /expenses/summary?clientId&dateFrom&dateTo`. |

---

## `/finance` — `FinancePage`

| | |
|---|---|
| **Purpose** | Record and review manual expenses and incomes (not from WB sync). |
| **Shows** | Tabs: add expense, add income, history (paginated tables, filters, edit/delete where allowed). |
| **Data** | `GET /clients`; `GET /expense-categories`; `POST /expenses`; `POST /incomes`; `GET /expenses` / `GET /incomes` with query params; `PATCH` / `DELETE` on `/expenses/:id` and `/incomes/:id`. |

**Note:** `/expenses` redirects to `/finance`.

---

## `/expense-categories` — `ExpenseCategoriesPage` (admin only)

| | |
|---|---|
| **Purpose** | Manage the expense category catalog (labels, colors, icons, order, active flag). |
| **Shows** | Access denied for non-admins; otherwise table and create/edit/delete dialogs. |
| **Data** | `GET /expense-categories/admin`; `POST /expense-categories`; `PATCH /expense-categories/:id`; delete via the panel’s API as implemented. |

---

## `/analytics` — `AnalyticsPage`

| | |
|---|---|
| **Purpose** | Visual analytics for **one** client over a date range. |
| **Shows** | Client selector, date range, charts (WB daily series, fee breakdown, expense pie, daily extra expense totals), theme-aware styling. |
| **Data** | `GET /clients` (first client auto-selected); `GET /wb/report/:id?...`; `GET /expenses/summary?...`; `GET /expenses/daily-totals?clientId&dateFrom&dateTo`. |

---

## `/balances` — `BalancesPage`

| | |
|---|---|
| **Purpose** | Latest WB balance per client (current + for withdrawal) with short history sparklines; compares to alert thresholds. |
| **Shows** | Per-client cards, currency formatting, border cues vs threshold, 7-day mini charts. |
| **Data** | `GET /clients`; `GET /alerts/config`; `GET /wb/balance/:clientId`; `GET /wb/balance/:clientId/history?days=7` (per client). |

---

## `/users` — `UsersPage` (admin only)

| | |
|---|---|
| **Purpose** | Back-office user management (logins, roles, optional Telegram id). |
| **Shows** | Access denied for viewers; otherwise user table and CRUD dialogs. |
| **Data** | `GET /users`; `POST /users`; `PATCH /users/:id`; `DELETE /users/:id`. |

---

## `/settings` — `SettingsPage` (admin only)

| | |
|---|---|
| **Purpose** | Manually trigger background jobs (e.g. WB sync) that mirror server scheduler tasks. |
| **Shows** | Job list with schedule labels, run buttons, success/error feedback. |
| **Data** | `GET /wb/scheduler/jobs`; `POST /wb/scheduler/jobs/:id/run` (invalidates client/WB queries on success). |

---

## Route map

| Path | Page |
|------|------|
| `/login` | Login |
| `/` | Dashboard |
| `/clients` | Client list / CRUD |
| `/clients/:id` | Client detail |
| `/finance` | Expenses & incomes |
| `/expense-categories` | Category admin |
| `/analytics` | Charts & reports |
| `/balances` | Balances overview |
| `/users` | User admin |
| `/settings` | Scheduler jobs |

Defined in `src/App.tsx`.
