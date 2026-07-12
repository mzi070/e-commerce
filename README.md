# NextShop — Production E-Commerce Storefront

A production-ready e-commerce storefront built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS 4**, **Prisma 7 + PostgreSQL**, and **Stripe Checkout**.

Money is stored and computed in **integer cents**. The server re-prices every checkout from authoritative product records. Orders are fulfilled idempotently in a **Stripe webhook handler**, not on the client success page.

## Features

- **Catalog** — server-rendered product grid with search, category filter, and sort (ISR cached)
- **Product pages** — static generation per product, SEO metadata, JSON-LD structured data
- **Cart** — localStorage persistence with SSR-safe hydration, slide-over panel, stock-capped quantities
- **Checkout** — Stripe Checkout Sessions created server-side from validated line items
- **Fulfillment** — webhook-verified, idempotent order creation on `checkout.session.completed`
- **Guest checkout** — no account required; optional shipping address via config flag
- **Admin** — product CRUD and order management (auth-gated)
- **Security** — Zod validation, rate limiting, CSP headers, safe redirects

## Prerequisites

- Node.js 20.9+
- PostgreSQL
- [Stripe account](https://dashboard.stripe.com/register) (test mode is fine for development)

## Quick start

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and Stripe keys (see below)

npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Stripe local webhook forwarding

In a second terminal:

```bash
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) into `.env` as `STRIPE_WEBHOOK_SECRET`.

## Environment variables

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `DATABASE_URL` | Yes | Your PostgreSQL connection string |
| `JWT_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL (e.g. `http://localhost:3000`) |
| `STRIPE_SECRET_KEY` | For payments | [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Same page (publishable key) |
| `STRIPE_WEBHOOK_SECRET` | For fulfillment | `stripe listen` output or Dashboard → Webhooks |
| `STRIPE_TAX_ENABLED` | No | Set `"true"` to enable Stripe Tax |
| `STRIPE_COLLECT_SHIPPING` | No | Set `"true"` to collect shipping address |
| `FLAT_SHIPPING_CENTS` | No | Flat shipping fee in cents (e.g. `500` = $5.00) |

Secrets are loaded lazily — the build does not require Stripe keys.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Run unit tests (pricing logic) |
| `npm run typecheck` | TypeScript strict check |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed products and demo users |

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@nextshop.dev` | `admin1234` |
| Customer | `customer@nextshop.dev` | `customer1234` |

## Architecture

```
src/
├── actions/           # Server Actions (auth, stripe-checkout, product, order)
├── app/               # App Router routes + webhook API route
├── components/        # UI (storefront islands + admin)
├── lib/
│   ├── queries/       # Data layer: getProducts, getProduct, createOrder, …
│   ├── pricing.ts     # Server-side re-pricing guard (security-critical)
│   ├── cart-storage.ts# Client cart persistence (localStorage)
│   ├── fulfillment.ts # Webhook order fulfillment
│   └── stripe.ts      # Lazy Stripe client
└── proxy.ts           # Route protection
```

### Money

All prices are **integer cents** (`priceCents`, `totalCents`). Display formatting happens only at the UI boundary via `formatCurrencyFromCents()`.

### Checkout flow

1. Client sends `{ productId, quantity }[]` to `createCheckoutSession`
2. Server validates with Zod, re-prices from DB, creates Stripe Checkout Session
3. User pays on Stripe-hosted page
4. Stripe webhook calls `/api/webhooks/stripe` with signed payload
5. `fulfillCheckoutSession()` creates order idempotently (unique `stripeSessionId`)
6. Success page verifies session server-side before showing confirmation

## Testing

```bash
npm run test
```

Unit tests cover the pricing/cart-total logic and the server-side re-pricing guard in `src/lib/pricing.test.ts`.

## What I'd do next for production

1. **Real inventory backend** — Replace Prisma file with a dedicated inventory service; add stock reservation during checkout session TTL
2. **Stripe Products/Prices** — Sync catalog to Stripe instead of inline `price_data`; enables promotions and subscriptions
3. **Fraud & 3DS** — Enable Stripe Radar rules; use `payment_intent_data` for SCA where required
4. **Observability** — Structured logging (no PII), error tracking (Sentry), webhook delivery monitoring
5. **Order confirmation email** — Send transactional email on fulfillment via Resend/SendGrid with order snapshot
6. **Distributed rate limiting** — Replace in-memory limiter with Redis/Upstash for multi-instance deploys
7. **CI/CD** — GitHub Actions: lint, typecheck, test, migrate deploy on Vercel

## License

GPL-3.0
