# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## PriceHub artifact

Russian-language dark/minimalist price comparison SaaS. Two sides:

- **Buyers** — search & compare prices across Ozon, Wildberries, Я.Маркет, DNS, AliExpress
- **Sellers** — own products, sales analytics, AI insights, news, chats with support
- **Internal panel** (developer/support roles) — users, products, devs/permissions, console, audit, servers, code editor, seller history

### Apps

- `artifacts/api-server` — Express + Drizzle + express-session/connect-pg-simple. Auto-creates `user_sessions` table on boot. Seeds DB on boot via `seed.ts`.
- `artifacts/pricehub` — Vite + React + wouter + shadcn/ui + Recharts. Forced dark mode. Accent: violet HSL 260 85% 60%.

### Auth & roles

- Internal Hub ID (string username + password). Sessions cookie `pricehub.sid`.
- Roles: `buyer`, `seller`, `support`, `developer`. Permissions array (16 scopes) for fine-grained admin access.
- Seeded accounts:
  - `Jonny_mainDev007` / `Jonny_r23` — main developer (all permissions, tier `studio`)
  - `support_anya` / `support123` — support (limited scopes)
  - `ozon_seller` / `seller123` — seller (tier `pro`, has products + 14d sales)
  - `buyer_irina` / `buyer123` — buyer

### Conventions

- Currency formatted with `Intl.NumberFormat('ru-RU')` + ` ₽`.
- React Query hooks from `@workspace/api-client-react` (Orval codegen).
- Zod schemas from `@workspace/api-zod`.
- Permission gating in UI via `<Can scope="...">` from `@/lib/auth`.
- Logo is an inline SVG component at `artifacts/pricehub/src/components/logo.tsx` (no external assets).
