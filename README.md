# NextShop — Modern E‑Commerce

A production‑grade, full‑stack e‑commerce application built with the **Next.js 16 App Router**, **React 19**, **Prisma 7 (PostgreSQL)**, and **Tailwind CSS 4**. It demonstrates end‑to‑end shopping flows — catalog, cart, checkout, orders — plus an admin dashboard, all with type‑safe Server Actions and a security‑first design.

## Features

- **Storefront** — product catalog, product detail pages, and responsive UI with light/dark mode.
- **Authentication** — email/password auth with JWT sessions stored in secure, HTTP‑only cookies (edge‑safe via `jose`), bcrypt password hashing, and user‑enumeration/timing‑attack mitigations.
- **Shopping cart** — server‑persisted per user with optimistic UI updates (`useOptimistic`) and live stock validation.
- **Checkout** — orders are placed inside a single **Serializable** transaction with atomic, oversell‑safe stock decrements, server‑computed totals (never trusts the client), and automatic retry on write conflicts.
- **Orders** — customer order history and an admin order board with status management. Order line items are **snapshotted** at purchase time so history stays accurate even if products change.
- **Admin dashboard** — role‑gated product CRUD and order management.
- **Best practices** — Zod validation on every Server Action, typed `ActionResult` discriminated unions, route protection via `proxy.ts`, security response headers, SEO (`sitemap.ts`, `robots.ts`, Open Graph metadata), optimized images (`next/image`), and error/loading boundaries.

## Tech stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Framework  | Next.js 16 (App Router, Server Actions)      |
| UI         | React 19, Tailwind CSS 4                     |
| Database   | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`) |
| Auth       | `jose` (JWT), `bcryptjs`                      |
| Validation | Zod 4                                         |
| Language   | TypeScript (strict)                          |

## Getting started

### Prerequisites

- Node.js **20.9+** (Node 26 supported)
- A PostgreSQL database

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable              | Description                                             |
| --------------------- | ------------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                            |
| `JWT_SECRET`          | Secret for signing session JWTs (min 16 chars)          |
| `NEXT_PUBLIC_SITE_URL`| Public base URL, used for metadata/sitemap/robots       |

Generate a strong secret with `openssl rand -base64 32`.

### 3. Set up the database

```bash
npm run db:migrate   # create tables from the Prisma schema
npm run db:seed      # seed sample products and demo users
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials (from the seed)

| Role     | Email                   | Password       |
| -------- | ----------------------- | -------------- |
| Admin    | `admin@nextshop.dev`    | `admin1234`    |
| Customer | `customer@nextshop.dev` | `customer1234` |

## Available scripts

| Script                | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start the development server             |
| `npm run build`       | Production build                         |
| `npm run start`       | Start the production server              |
| `npm run lint`        | Run ESLint                               |
| `npm run typecheck`   | Type‑check with `tsc`                    |
| `npm run db:generate` | Generate the Prisma client              |
| `npm run db:migrate`  | Apply migrations (dev)                   |
| `npm run db:deploy`   | Apply migrations (production)            |
| `npm run db:seed`     | Seed the database                        |
| `npm run db:studio`   | Open Prisma Studio                       |

## Project structure

```
src/
├── actions/        # Server Actions (auth, cart, checkout, product, order)
├── app/            # App Router routes, layouts, error/loading boundaries, SEO
├── components/     # UI components (storefront, cart, admin, auth, layout)
├── generated/      # Generated Prisma client (git‑ignored)
├── lib/
│   ├── auth/       # JWT, password hashing, session helpers
│   ├── queries/    # Read‑side data access (products, cart, orders)
│   └── validations/# Zod schemas
└── proxy.ts        # Route protection (Next.js 16 "proxy" convention)
prisma/
├── schema.prisma   # Data model
└── seed.ts         # Seed script
```

## Security notes

- Sessions use signed JWTs in HTTP‑only, `SameSite=Lax` cookies; `Secure` is enabled in production.
- Passwords are hashed with bcrypt (12 rounds). Login runs a constant decoy comparison to reduce user‑enumeration timing leaks.
- All Server Actions validate input with Zod and enforce auth/role checks server‑side.
- Checkout computes totals from authoritative DB prices inside a Serializable transaction with oversell‑safe stock decrements.
- Baseline security headers are applied in `next.config.ts`.

## License

GPL‑3.0
