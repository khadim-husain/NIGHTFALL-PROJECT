# Project Nightfall — Backend REST API & Real-time Operations Engine

> **Production Node.js, TypeScript, Express, PostgreSQL, Prisma, & Socket.IO Platform**  
> Serving Project Nightfall — Smart Printing Operations & Fleet Management.

---

## 🚀 Tech Stack

- **Runtime & Language:** Node.js (v18+ / v22.x tested) with TypeScript (Strict ESM)
- **API Framework:** Express.js REST API
- **Authoritative Database:** PostgreSQL 18 with Prisma ORM
- **Real-Time Gateway:** Socket.IO with room-based pub/sub telemetry
- **Security & RBAC:** Helmet, CORS allowlist, rate limiting, Firebase ID token verification + safe demo fallback, SHA-256 hashed revocable kiosk credentials
- **Storage:** Private object storage abstraction (HMAC-signed short-lived URLs, Supabase Storage, or secure local filesystem)
- **Validation & Logging:** Zod schemas and Pino structured logger
- **Testing:** Vitest with Supertest (Unit, Integration, Security, Concurrency, Recovery)
- **Documentation:** Interactive OpenAPI 3.0 (Swagger UI at `/api/docs`)

---

## 📁 Backend Directory Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Authoritative PostgreSQL schema
│   ├── migrations/                # Version-controlled migrations
│   └── seed.ts                    # Safe seed script (12 kiosks, 3 zones, demo orders)
├── src/
│   ├── config/                    # Env validation, Prisma, Logger, Pricing engine
│   ├── middleware/                # Auth, KioskAuth, RBAC, Rate limiter, Error handler
│   ├── modules/
│   │   ├── auth/                  # Login, session tokens, profile
│   │   ├── zones/                 # Zone A, B, C management
│   │   ├── kiosks/                # Fleet status, heartbeat, atomic claim, restart, revoke
│   │   ├── documents/             # Upload, mime/size checks, signed URLs
│   │   ├── orders/                # Server pricing calculation, order creation, listing
│   │   ├── payments/              # Simulated payment with strict idempotency
│   │   ├── incidents/             # Triage, resolve, kiosk status restoration
│   │   ├── audit-logs/            # Immutable security audit trail
│   │   ├── realtime/              # Socket.IO server & event publisher
│   │   └── simulator/             # Background print progression engine
│   ├── routes/                    # API v1 router aggregation & health check
│   ├── app.ts                     # Express application configuration
│   └── server.ts                  # Server entrypoint (HTTP + Socket.IO)
├── tests/
│   ├── unit/                      # Server-side pricing calculation tests
│   ├── security/                  # RBAC, token verification, revoked kiosk tests
│   ├── integration/               # Orders & payment idempotency tests
│   ├── concurrency/               # Atomic job claim race condition tests
│   └── recovery/                  # Physical uncertainty & recovery tests
├── docs/                          # OpenAPI spec, architecture diagram, test report
├── .env.example                   # Environment configuration template
└── tsconfig.json                  # TypeScript configuration
```

---

## 🛠️ Quick Start & Setup

### 1. Prerequisites
- Node.js `v18.x` or `v22.x`
- PostgreSQL 14+ running locally or remotely (tested with PostgreSQL 18)

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your PostgreSQL connection:
```env
DATABASE_URL="postgresql://postgres:admin@localhost:5432/nightfall?schema=public"
```

### 3. Run Migrations & Seed Database
```bash
# Apply Prisma migrations
npm run db:deploy
# or npx prisma migrate dev

# Seed 12 kiosks across 3 zones and demo orders
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
The server will boot on `http://localhost:8000`:
- **API Endpoint:** `http://localhost:8000/api/v1`
- **Interactive Swagger Docs:** `http://localhost:8000/api/docs`
- **Health Check:** `http://localhost:8000/api/v1/health`

---

## 🧪 Running Automated Tests

Run the complete test suite:
```bash
npm run test
```

Expected result:
```
 Test Files  5 passed (5)
      Tests  17 passed (17)
```

---

## 🔐 Credentials & External Integrations Disclosure

1. **Development & Demo Credentials:**
   - **Administrator:** `admin@nightfall.io` / `nightfall-enterprise`
   - **Kiosk Keys:** Pre-provisioned test keys: `kiosk-secret-<ID>-2026` (e.g. `kiosk-secret-K01-2026`)
2. **External Cloud Services (Optional for Production):**
   - **Firebase Authentication:** Requires `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` for production ID token verification. When unconfigured, the server operates safely in Local Demo mode (`ALLOW_DEMO_AUTH=true`) with signed JWT sessions.
   - **Supabase Storage:** Requires `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`. When unconfigured, the system automatically uses the private local filesystem storage driver with cryptographic HMAC download signatures.
3. **AI-Assisted Development Disclosure:**
   - The backend implementation, database schema, Prisma migrations, test suite, and integration bridges were authored with AI-assisted software engineering practices adhering to strict enterprise standards.

---

## 🔧 Troubleshooting

- **Database Connection Error (`P1001`):** Ensure PostgreSQL service is running on port 5432 and the `nightfall` database exists (`CREATE DATABASE nightfall;`).
- **Port Conflict (8000):** Change `PORT=8001` in `.env` and update `NEXT_PUBLIC_API_URL` in `frontend/.env.local`.
- **CORS Error:** Ensure `CORS_ORIGIN=http://localhost:3000` matches the frontend URL.

