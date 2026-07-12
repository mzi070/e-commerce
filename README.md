# NextShop — Production E-Commerce Storefront

A production-ready e-commerce storefront built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS 4**, **Prisma 7 + PostgreSQL**, and **Swipez Payment Gateway**.

Money is stored and computed in **integer cents**. The server re-prices every checkout from authoritative product records. Orders are fulfilled idempotently in a **Swipez webhook handler**, not on the client success page.

## Features

- **Catalog** — server-rendered product grid with search, category filter, and sort (ISR cached)
- **Product pages** — static generation per product, SEO metadata, JSON-LD structured data
- **Cart** — localStorage persistence with SSR-safe hydration, slide-over panel, stock-capped quantities
- **Checkout** — Swipez hosted payment via signed form POST, server-computed totals
- **Fulfillment** — webhook-verified, idempotent order creation on successful payment
- **Guest checkout** — no account required; optional shipping address via config flag
- **Admin** — product CRUD and order management (auth-gated)
- **Security** — Zod validation, rate limiting, CSP headers, MD5 checksum verification

## Prerequisites

- Node.js 20.9+
- PostgreSQL
- [Swipez merchant account](https://docs.swipez.in/payment-gateway/web-integration)

## Quick start

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, and Swipez credentials

npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Swipez webhook setup

In your Swipez merchant dashboard, configure:

- **Webhook URL:** `https://your-domain.com/api/webhooks/swipez`
- **Return URL** is set automatically to `/api/checkout/swipez/return`

For local testing, use a tunnel (e.g. ngrok) since Swipez requires a public HTTPS webhook URL.

## Environment variables

| Variable | Required | Where to get it |
|----------|----------|-----------------|
| `DATABASE_URL` | Yes | Your PostgreSQL connection string |
| `JWT_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL (e.g. `http://localhost:3000`) |
| `SWIPEZ_ACCOUNT_ID` | For payments | Swipez merchant dashboard |
| `SWIPEZ_XWAY_KEY` | For payments | Swipez support / dashboard |
| `SWIPEZ_CHECKOUT_URL` | No | Test: `https://h7sak8am43.swipez.in/xway/secure`, Live: `https://www.swipez.in/xway/secure` |
| `SWIPEZ_COLLECT_SHIPPING` | No | Set `"true"` to collect address on checkout |
| `FLAT_SHIPPING_CENTS` | No | Flat shipping fee in cents (e.g. `500` = $5.00) |

Secrets are loaded lazily — the build does not require Swipez keys.

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
├── actions/           # Server Actions (auth, swipe-checkout, product, order)
├── app/
│   └── api/
│       ├── checkout/swipez/return   # Swipez return URL handler
│       └── webhooks/swipez          # Payment fulfillment webhook
├── lib/
│   ├── queries/       # Data layer: getProducts, createOrder, …
│   ├── pricing.ts     # Server-side re-pricing guard
│   ├── swipe.ts       # Swipez hash generation & config
│   └── fulfillment.ts # Webhook order fulfillment
```

### Checkout flow

1. Client sends `{ productId, quantity }[]` + payer details to `createSwipeCheckout`
2. Server validates with Zod, re-prices from DB, stores `PaymentReference`
3. Server generates MD5 `secure_hash`, returns form fields
4. Client auto-posts form to Swipez hosted payment page
5. Swipez webhook calls `/api/webhooks/swipez` on success
6. `fulfillSwipezPayment()` creates order idempotently (unique `paymentReferenceNo`)
7. Success page verifies order exists server-side before confirming

## Testing

```bash
npm run test
```

Use Swipez test card: `4111 1111 1111 1111`, expiry `07/23`, CVV `123`.

## What I'd do next for production

1. **Real inventory backend** — stock reservation during payment window
2. **Swipez payment status polling** — backup verification if webhook is delayed
3. **Fraud controls** — velocity limits, address verification
4. **Observability** — structured logging (no PII), webhook delivery monitoring
5. **Order confirmation email** — send on fulfillment
6. **Distributed rate limiting** — Redis/Upstash for multi-instance deploys

## License

GPL-3.0
