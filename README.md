# Ledgerly: Multi-Tenant SaaS Expense Tracker

React, Node.js, Express, MongoDB and Stripe. Each organization gets a private workspace inside one shared database, with Stripe subscription billing.

```
expense-tracker/
├── backend/    Express API, Mongoose models, Stripe billing + webhooks
└── frontend/   React (Vite) app with Framer Motion animations
```

## Run it

Requires Node 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd backend
cp .env.example .env        # set MONGO_URI and JWT_SECRET
npm install
npm run seed                # optional: two demo workspaces
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Demo logins after seeding (password `Demo@1234`): `demo@acme.dev` (Free) and `demo@globex.dev` (Pro).

## How multi-tenancy works

- Every `User` and `Expense` stores an `organization` ID; indexes lead with it.
- Route handlers never query models directly. They use `tenantScope(Model, orgId)` (`backend/src/utils/tenant.js`), which forces the organization filter onto every find, update, delete, count and aggregation.
- The org ID comes from the signed-in user's database record, never from the request body, query or token payload, and the injected filter is applied last so clients can't override it.
- Another workspace's record ID simply returns 404.

## Stripe billing

| Piece | Where |
| --- | --- |
| Checkout (subscription mode) | `POST /api/billing/checkout` |
| Customer portal (cards, invoices, cancel) | `POST /api/billing/portal` |
| Webhook (raw body, signature verified) | `POST /api/billing/webhook` |

Webhook events handled: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`. Events are made idempotent with a unique `WebhookEvent` record, and a failed handler releases the lock so Stripe's retry reprocesses it. A failed payment marks the workspace `past_due` (Pro stays on during Stripe's retry window) and shows a banner in the app.

**Enable real payments:** create a recurring $12/month price in Stripe, then set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` in `backend/.env`. Locally: `stripe listen --forward-to localhost:5000/api/billing/webhook`.

**Demo mode:** with no Stripe keys (and not in production), the Billing page shows an event simulator that runs the same state transitions as the webhook, so the whole flow can be demoed without an account.

## Plans

| | Free | Pro ($12/mo) |
| --- | --- | --- |
| Expenses | 50 | Unlimited |
| Team seats | 1 | 10 |
| CSV export | No | Yes |

## API overview

`/api/auth` (register, login, me), `/api/expenses` (CRUD, filters, export), `/api/stats`, `/api/team`, `/api/billing`.
