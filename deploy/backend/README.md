# Backend Separate Deployment

This folder contains deployment configs to run `@workspace/api-server` as a standalone backend service.

## What this deploys

- API service from `artifacts/api-server`
- Session storage in Postgres (`user_sessions` table via `connect-pg-simple`)
- All routes mounted under `/api` (for example `/api/auth/me`)

## Option 1: Deploy on Render (recommended)

1. Create a new Render Web Service from this repository.
2. Set **Root Directory** to repository root (`.`).
3. Use:
   - Build Command: `pnpm install --frozen-lockfile && pnpm --filter @workspace/api-server run build`
   - Start Command: `pnpm --filter @workspace/api-server run start`
4. Add environment variables from `deploy/backend/.env.backend.example`.
5. Set `ALLOWED_ORIGINS` to your frontend domain (for example `https://pricehub-group.vercel.app`).

## Option 2: Deploy via Docker

Build and run:

```bash
docker build -f deploy/backend/Dockerfile -t pricehub-api .
docker run --env-file deploy/backend/.env.backend.example -p 8080:8080 pricehub-api
```

## Frontend connection

After backend deploy, set on frontend hosting:

- `VITE_API_BASE_URL=https://your-backend-domain`

Without this variable frontend uses same-origin `/api/*`, which causes `404` if backend is on another host.
