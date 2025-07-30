# SocialBoost – **Comprehensive Developer Handbook**

> **Version 2 – July 29 2025**\
> Rewritten to include full design system, influencer commission payouts (Stripe Connect), and subscription paywall mechanics.

---

## 1 · Purpose & Audience

This handbook is the **single source of truth** for engineers, designers, and product managers building the Shopify app **SocialBoost**. It covers brand design tokens, UI/UX conventions, data models, backend logic, API contracts, subscription/paywall enforcement, influencer commission payouts, environment setup, CI/CD, and future extensibility.

---

## 2 · Brand & Complete Design System

### 2.1 Color Palette

| Token               | Hex       | Usage                      |
| ------------------- | --------- | -------------------------- |
| `--sb-primary`      | `#0094FF` | Buttons, links, highlights |
| `--sb-primary‑dark` | `#007AE6` | Hover/active               |
| `--sb-success`      | `#12B76A` | Success toasts             |
| `--sb-danger`       | `#F04438` | Destructive actions        |
| `--sb-gray‑900`     | `#1D2939` | Heading text               |
| `--sb-gray‑700`     | `#344054` | Body text                  |
| `--sb-gray‑100`     | `#F2F4F7` | Background fill            |

### 2.2 Typography

| Purpose  | Font Stack                         | Size/Line‑height |
| -------- | ---------------------------------- | ---------------- |
| Display  | `Space Grotesk, Inter, sans‑serif` | 32 / 40 px       |
| Headline | same                               | 24 / 32 px       |
| Body     | `Inter, sans‑serif`                | 16 / 24 px       |
| Caption  | `Inter`                            | 12 / 18 px       |

*All sizes follow an ****8 px baseline grid****; use Tailwind **`text-base`**, **`text-sm`**, etc.*

### 2.3 Iconography

- **Library:** lucide‑react (24 px default).
- **Stroke weight:** 1.5 px; primary color inherits currentColor.
- **Common icons:** `user`, `hash`, `gift`, `link`, `dollar-sign`, `play-circle`.

### 2.4 Layout & Grid

- **Desktop width:** 1280 px max (16‑column, 72 px gutters).
- **Sidebar:** 240 px fixed; content flex‑1.
- **Cards:** `rounded‑xl shadow‑sm p‑6 bg‑white` (same as Polaris `Card`).

### 2.5 Component Tokens

| Component        | Token Overrides                                                               |
| ---------------- | ----------------------------------------------------------------------------- |
| Primary Button   | `@apply bg-[color:var(--sb-primary)] hover:bg-[color:var(--sb-primary-dark)]` |
| Input Focus Ring | `ring-2 ring-[color:var(--sb-primary)] ring-offset-1`                         |

---

## 3 · UI/UX Guidelines

1. **Zero‑State**: Every table/grid must show an illustration + CTA when empty.
2. **Progressive Disclosure**: Display simplified metrics; expand via “View details”.
3. **Feedback Timing**: Inline spinners ≤ 200 ms; toast success within 2 s.
4. **Accessibility**: WCAG 2.2 AA, focus trap in modals, keyboard shortcuts (`K`).
5. **Internationalization**: String keys via `next-intl`. 🏷️

---

## 4 · Tech Stack Overview

### 4.1 Runtime & Application Layers

| Layer                   | Technology                                        | Purpose / Rationale                                      |
| ----------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| **Runtime**             | **Node v20 LTS**                                  | Stable, widespread ecosystem                             |
| **Language**            | **TypeScript 5.5**                                | Type‑safety end‑to‑end                                   |
| **Framework**           | **Next.js 14 – App Router (RSC)**                 | Hybrid SSR/ISR, edge‑ready                               |
| **UI Library**          | **Shopify Polaris 13** + Tailwind CSS v3          | Native admin experience plus utility‑first customization |
| **State/Data**          | React Query (SWR)                                 | Incremental revalidation                                 |
| **Packaging**           | **pnpm 8** workspaces                             | Fast monorepo installs                                   |
| **Build Orchestration** | Turborepo                                         | Incremental caching                                      |
| **API Auth**            | Shopify OAuth, JWT (influencer), Stripe Signature | Secured sessions                                         |
| **Database**            | **PostgreSQL 15** (Supabase)                      | Relational integrity                                     |
| **ORM**                 | **Prisma 5**                                      | Declarative schema, migrations                           |
| **Cache / Queue**       | **Redis 7** + BullMQ                              | Idempotent job processing                                |
| **Payments**            | **Stripe v2025‑01‑15**                            | Subscription & Connect payouts                           |
| **Cloud Hosting**       | **Vercel** (Edge Functions + KV)                  | Low‑ops, auto‑scale                                      |
| **Containers (local)**  | Docker Compose                                    | Parity with prod services                                |
| **Monitoring**          | Sentry + Vercel Analytics                         | Error + performance insights                             |
| **CI/CD**               | GitHub Actions → Vercel Preview/Prod              | PR previews, auto deploy                                 |
| **Testing**             | Vitest (unit) · Playwright (e2e) · MSW (mocks)    | 90 % critical path                                       |

### 4.2 Tooling & Developer Experience

- **ESLint + Prettier** with Airbnb TS base.
- **Husky** pre‑commit → `lint-staged` on changed files.
- **Storybook 8** for isolated component dev.
- **GraphiQL Explorer** served at `/api/graphql` (dev only).
- **Swagger (OpenAPI 3)** auto‑generated at `/docs`.

### 4.3 Environment Matrix

| Environment | Branch      | DB            | Redis          | Stripe Mode | Vercel Project    |
| ----------- | ----------- | ------------- | -------------- | ----------- | ----------------- |
| **Dev**     | `develop`   | Supabase‑dev  | Upstash‑dev    | Test        | `socialboost‑dev` |
| **Preview** | PR branches | ephemeral     | shared‑preview | Test        | autogenerated     |
| **Prod**    | `main`      | Supabase‑prod | Upstash‑prod   | Live        | `socialboost`     |

---

## 5 · Environment Setup

1. `pnpm i`
2. `docker compose up -d db redis`
3. `pnpm prisma migrate dev`
4. `pnpm dev`
5. `ngrok http 3000` → update Shopify **HOST**.

> **New dotenv keys**\
> `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`\
> `SUBSCRIPTION_PLANS_JSON` (see § 9.3)

---

## 6 · High‑Level Architecture

```mermaid
graph TD
  subgraph Frontend (Next.js)
    A1[Polaris + Tailwind UI]
  end
  subgraph Serverless API Routes
    B1[/api/influencers] --> PSQL
    B2[/api/subscription] --> PSQL
    B3[/api/payouts] --> Stripe
  end
  IG[Instagram Webhooks] --> B3
  TikTok --> B3
  Shopify --> B1
  Redis[[Queue]] -->|jobs| B3
```

---

## 7 · Data Models (additions)

```prisma
model Plan {
  id        String   @id @default(cuid())
  name      String   @unique
  priceCents Int
  ugcLimit  Int
  influencerLimit Int
}

model Subscription {
  id           String   @id @default(cuid())
  merchantId   String   @unique
  planId       String
  stripeSubId  String
  status       SubStatus @default(ACTIVE)
  currentPeriodEnd DateTime
  merchant     Merchant @relation(fields: [merchantId], references: [id])
  plan         Plan     @relation(fields: [planId], references: [id])
}

enum SubStatus { ACTIVE PAST_DUE CANCELED }
```

---

## 8 · Workflows

### 8.1 Influencer Commission Payout (Stripe Connect)

```sequenceDiagram
merchant->>dashboard: Enable Revenue Sharing toggle
Dashboard->>influencer: "Connect with Stripe"
influencer->>Stripe: OAuth Express onboarding
Stripe-->>influencer: redirect + account_id
influencer-->>dashboard: token exchange
loop weekly payout cron
  dashboard->>Postgres: fetch unpaid commissions
  dashboard->>Stripe: POST /v1/transfers (destination=account_id)
  Stripe-->>dashboard: transfer.id
  dashboard->>Postgres: mark paid
end
```

- **Commission Formula** `(orderSubtotal – discounts) × rate%` (merchant configurable 5–30 %).
- Refunds create *negative transfers* on next cycle.

### 8.2 SocialBoost Subscription Paywall

1. **Plans** – Free / Pro / Scale.
2. **Gate Middleware** `withSubscriptionGate` (402 if over plan).
3. **Usage Metering** – Redis counters `UGC:{merchant}:{period}`.
4. **Upgrade Flow** – Stripe Checkout Session via `/api/subscription/upgrade`.
5. **Downgrade Guard** – block if usage exceeds lower limits.

### 8.3 Merchant App Store & Onboarding Journey

| Step                                                | Actor                      | Action / Screen                                                                                                |
| --------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1                                                   | Merchant                   | Searches **“SocialBoost”** in Shopify App Store.                                                               |
| 2                                                   | Shopify App Store          | Displays listing: hero video, screenshots, pricing tiers, ⭐ reviews.                                           |
| 3                                                   | Merchant                   | Clicks **Add App** → redirected to `https://<store>.myshopify.com/admin/oauth/...` permission page.            |
| 4                                                   | Permissions Screen         | Lists scopes (`read_orders`, `write_discounts`, etc.) + Paywall plan preview. Merchant clicks **Install App**. |
| 5                                                   | OAuth Callback             | `/api/auth/shopify/callback` exchanges `code` for `access_token`, inserts row in `Merchant` table.             |
| 6                                                   | Billing Gate (if not Free) | If merchant selects Pro/Scale, app triggers `` then redirects to Shopify billing confirmation page.            |
| 7                                                   | First‑Run Wizard           | App loads `/onboarding` route:                                                                                 |
|  a. Choose modules (Influencer Codes, UGC Rewards). |                            |                                                                                                                |
|  b. Connect Instagram &/or TikTok.                  |                            |                                                                                                                |
|  c. Configure default discount template.            |                            |                                                                                                                |
|  d. Enable (optional) Revenue Sharing toggle.       |                            |                                                                                                                |
| 8                                                   | Dashboard Tour             | Spotlight walkthrough (intro.js) highlighting Metrics, Influencers, UGC queue, Billing.                        |
| 9                                                   | Success Email              | Welcome email with docs link & Slack community invite.                                                         |
| 10                                                  | Ongoing                    | `APP_UNINSTALLED` webhook → soft‑delete merchant, cancel Stripe sub, revoke tokens.                            |

> **Edge Cases**: If merchant cancels during Shopify billing step, redirect back with `?canceled=true` and show banner.

## 9 · API & Endpoint Structure

 · API & Endpoint Structure

### 9.1 Merchant‑Facing REST

| Method | Route                       | Gate             | Description                     |
| ------ | --------------------------- | ---------------- | ------------------------------- |
| POST   | `/api/subscription/upgrade` | `Free,Pro`       | Create Stripe checkout session  |
| POST   | `/api/subscription/webhook` | none             | Stripe webhook (sig)            |
| GET    | `/api/subscription`         | `Free,Pro,Scale` | Return plan + usage             |
| GET    | `/api/payouts/summary`      | `Pro,Scale`      | Return influencer payout ledger |

### 9.2 Influencer Portal

| Method | Route                            | Auth | Description                |
| ------ | -------------------------------- | ---- | -------------------------- |
| GET    | `/api/influencer/earnings`       | JWT  | Monthly earnings breakdown |
| POST   | `/api/influencer/stripe/connect` | JWT  | Begin OAuth                |

### 9.3 Configuration via `SUBSCRIPTION_PLANS_JSON`

```json
[
  {"name":"Free","price":0,"ugcLimit":20,"influencerLimit":5},
  {"name":"Pro","price":29,"ugcLimit":1000,"influencerLimit":∞},
  {"name":"Scale","price":99,"ugcLimit":∞,"influencerLimit":∞}
]
```

---

## 10 · Frontend Code Map

```text
/app
  layout.tsx            # Polaris Frame + SubscriptionBanner
  page.tsx              # Metrics Overview (paywall cards if over limit)
  /billing
    page.tsx            # Stripe Checkout redirect handler
  /components
    PaywallModal.tsx
    UsageMeter.tsx
  /hooks
    useSubscription.ts  # SWR fetcher + gate helpers
```

---

## 11 · Backend Services & Jobs

- **Queue:** `createPayouts` (cron Fri 02:00 AEST)
- **Job Retry Policy:** 3 attempts, exponential back‑off, fail to `dead‑letter` set.
- **Dead‑letter UI:** `/admin/jobs` (Scale plan only).

---

## 12 · Security & Compliance (delta)

- **PCI DSS SAQ A** (card details handled by Stripe).
- **Transfer Lockout**: if bank account verification pending, disable payouts.

---

## 13 · Testing Enhancements

- **Paywall Tests**: Playwright scenario that simulates >20 UGC posts on Free plan and expects upgrade modal.
- **Payout Contract Test**: PACT mock for `POST /v1/transfers` asserting amount & destination.

---

## 14 · Deployment & Rollback

- **Blue‑Green** on Vercel: production slot + standby.
- Rollback env var `DEPLOY_VERSION`.

---

## 15 · Monitoring & Alerts

- Alert if `queue:payouts:failed` > 0 in 1 h.
- Alert if `/metrics paywall_blocked_total` spikes > 100 / day.

---

## 16 · Future Roadmap

- **Per‑product promo links** (variant‑level codes).
- **AI Fraud Detection** for fake UGC detection.
- **Regional tax compliance** for influencer payouts (ATO, GST).

---

### Glossary (additions)

| Term                | Definition                                              |
| ------------------- | ------------------------------------------------------- |
| *Paywall*           | Runtime enforcement blocking feature until plan upgrade |
| *Connected Account* | Stripe account owned by influencer receiving payouts    |

---

© 2025 SocialBoost – Internal & Confidential

