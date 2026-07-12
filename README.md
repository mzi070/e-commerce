# NextShop — Modern E-Commerce Storefront

A production-ready e-commerce storefront built with **Next.js 16 (App Router)**, **React 19**, **TypeScript (strict)**, **Tailwind CSS 4**, and **Prisma 7 + PostgreSQL**.

Money is stored and computed in **integer cents**. The server re-prices cart lines from authoritative product records. Payment integration is intentionally left out so you can plug in your own provider later (e.g. Swipe MV, Stripe).

## Features

- **Catalog** — server-rendered product grid with search, category filter, and sort
- **Product pages** — static generation, SEO metadata, JSON-LD structured data
- **Cart** — localStorage persistence with SSR-safe hydration, slide-over panel
- **Checkout** — cart review page (payment placeholder — add your provider later)
- **Admin** — product CRUD and order management
- **Auth** — optional login for dashboard and admin
- **Security** — Zod validation, rate limiting on auth, CSP headers

## Prerequisites

- Node.js 20.9+
- PostgreSQL

## Quick start

```bash
npm install
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET

npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Session signing secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public site URL for metadata/SEO |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run test` | Unit tests (pricing logic) |
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
├── actions/        # Server Actions (auth, product, order)
├── app/            # App Router routes
├── components/     # UI (storefront islands + admin)
├── lib/
│   ├── queries/    # Data layer: getProducts, getOrders, …
│   ├── pricing.ts  # Server-side re-pricing guard
│   └── cart-storage.ts
```

## Adding payments later

Hook your provider into:

1. `src/components/checkout/checkout-client.tsx` — replace the placeholder with your pay button / QR flow
2. A new `src/app/api/webhooks/<provider>/route.ts` — idempotent order fulfillment
3. `src/lib/queries/orders.ts` — `createOrder()` when payment confirms

Keep re-pricing in `src/lib/pricing.ts` and pass only `{ productId, quantity }` from the client.

## License

GPL-3.0
