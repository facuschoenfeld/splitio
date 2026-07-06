# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Split Expenses (a.k.a. "Splitio") is a **fullstack** app for tracking shared expenses among groups. It has two independent parts:

- `frontend/` — React 19 SPA (Vite, Tailwind, Zustand), routes in Spanish (`/grupos`, `/gastos`, `/balances`, `/perfil`).
- `backend/` — Express 5 REST API backed by PostgreSQL via Knex, with JWT auth.

The frontend consumes the backend over `/api` — there is **no** mock data in the running app (`src/data/mockData.js` still exists but the Zustand stores fetch from the API). Auth is JWT-based with access/refresh tokens stored in `localStorage`.

Product requirements live in `FEATURES.md`. A known-issues audit lives in `AUDIT_REPORT.md` (some items already fixed, e.g. CORS via env var, auth rate limiting, `utils/authorization.js`).

## Commands

### Frontend (`cd frontend`)
```bash
npm run dev      # Vite dev server (localhost:5173)
npm run build    # production build to dist/
npm run lint     # ESLint
npm run preview  # preview production build
```

### Backend (`cd backend`)
```bash
npm run dev              # nodemon src/index.js (localhost:3001)
npm start                # node src/index.js
npm run migrate          # knex migrate:latest
npm run migrate:rollback # knex migrate:rollback
npm run seed             # knex seed:run
```
Requires a `.env` (see `backend/.env.example`): `DB_*` connection vars, `JWT_SECRET`, `CORS_ORIGIN`/`FRONTEND_URL`, and a Resend API key for email. `NODE_ENV` selects the knex config (`development` default, `production` supports `DATABASE_URL`).

## Backend architecture (`backend/src/`)

Layered Express app: `routes → validators (express-validator) → controllers → config/db (knex)`. Entry point `index.js` mounts CORS, JSON parsing, the four route modules, and an error-handling middleware.

- **Routes** (`routes/`): `auth`, `users`, `groups`, `expenses`, `invitations`, all under `/api`.
  - `auth`: `POST /register`, `/login`, `/refresh` (rate-limited, 10 req / 15 min).
  - `users`: `GET /`, `GET /me`, `PUT /me`, `POST|DELETE /me/avatar` (multer upload), `GET /:id`, `PUT /:id`.
  - `groups`: CRUD + `GET|POST /:id/members`, `PUT|DELETE /:id/members/:userId`, `GET /:id/balances`, `POST /:id/summary` (emails a PDF/HTML summary), `GET|POST /:id/invitations` + `DELETE /:id/invitations/:invitationId` (invite by email / list / revoke), `GET|POST|DELETE /:id/invite-code` (shareable group code; POST/DELETE admin-only).
  - `expenses`: CRUD + `POST /settle` (records a debt settlement).
  - `invitations`: `GET /:token` (public preview), `POST /:token/accept` (auth — joins the group, enforces the 10-member cap).
- **Auth** (`middleware/auth.js`): verifies `Bearer` JWT with `JWT_SECRET`, sets `req.user = { id, email }`. Applied via `router.use(auth)` on users/groups/expenses.
- **Authorization** (`utils/authorization.js`): `isGroupMember(userId, groupId)` and `isGroupAdmin(userId, groupId)` — use these to guard group/expense ownership in controllers.
- **Services** (`services/`): `emailService` (Resend) for invitations/summaries, `pdfService` (pdfkit) for summary PDFs.
- **Passwords**: bcrypt. Invited users have `password: null` until they register.

### Database schema (Knex migrations in `backend/migrations/`)
UUID primary keys throughout (`knex.fn.uuid()`).
- **users**: `id, name, email (unique), password, avatar, created_at` + `status` (006), `payment_alias` (007), `cbu` (008), `reset_token_hash`/`reset_token_expires` (010), `notify_group_invites`/`notify_group_summaries` (011, default true).
- **groups**: `id, name, description, emoji, created_by → users (SET NULL), created_at`. The creator is the group admin.
- **group_members**: composite PK `(group_id, user_id)`, `joined_at`, plus per-group member overrides `nickname, payment_alias, cbu` (009). Both FKs `CASCADE`.
- **group_invitations** (012): `id, group_id (CASCADE), email (null ⇒ shareable reusable code; set ⇒ personal single-use), token (unique, plaintext), invited_by → users (SET NULL), expires_at, accepted_at, created_at`.
- **expenses**: `id, group_id (CASCADE), description, amount (decimal 12,2), paid_by → users, category, date, created_at`.
- **expense_splits**: composite PK `(expense_id, user_id)`, both FKs `CASCADE` — the members an expense is split between.

The 10-member-per-group cap (incl. creator) is `MAX_GROUP_MEMBERS` in `utils/invitations.js`, enforced in group `create`, `addMember`, and invitation `accept`.

Settlements are stored as expenses with `category: 'settlement'`; most aggregations filter these out.

## Frontend architecture (`frontend/src/`)

### API client (`api/client.js`)
Single `api(path, { method, body, auth })` wrapper over `fetch` against `/api`. Handles token storage (`setTokens`/`clearTokens`) and transparently refreshes the access token on a `401`, redirecting to `/login` if refresh fails.

### State management (Zustand stores in `stores/`)
All data stores are async and call `api(...)`:
- `useAuthStore` — `init`, `login`, `register`, `updateProfile`, `logout`; holds `user`.
- `useGroupStore` — `groups` + `members`; fetch/add/update/delete groups and `updateGroupMember`.
- `useExpenseStore` — `expenses`; fetch/add/delete + `settleDebt`.
- `useActivityStore` — recent activity feed.
- `useUIStore` — sidebar + the active modal system (`activeModal` + `modalData`).
- `useThemeStore` — dark/light theme, persisted to `localStorage`.

`App.jsx` runs `useAuthStore.init()` on mount and, once a `user` exists, polls `fetchGroups`/`fetchMembers`/`fetchExpenses` every 30s.

### Modal system
Modals render at the root in `App.jsx` (only when logged in), controlled via `useUIStore`: `openModal('name', data)` / `closeModal()`. Root modals: `CreateGroupModal`, `EditGroupModal`, `EditMemberModal`, `AddExpenseModal`, `SettleDebtModal`, `DeleteGroupModal`.

### Routing (`router/AppRouter.jsx`)
`/login` and `/register` are public; everything else is wrapped in `ProtectedRoute` + `Layout`: `/` (Dashboard), `/grupos`, `/grupos/:id`, `/gastos`, `/balances`, `/perfil`, and a `*` NotFound.

### Balance calculation (`utils/calculateBalances.js`)
- `calculateGroupBalances(expenses, members)` — net balance per member (positive = owed money, negative = owes).
- `calculateDebts(balances)` — greedy creditor/debtor matching to minimize transactions.
(The backend also exposes `GET /groups/:id/balances`.)

### Conventions
- Path alias `@` → `src/` (in `vite.config.js`); use `@/` for internal imports.
- Toasts via `sonner`. Styling via Tailwind 4.
- **Validate on both sides**: e.g. the 10-member-per-group limit must be enforced in the backend, not only the UI.
