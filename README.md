# Project Nightfall — Smart Printing Operations & Fleet Management Platform

Project Nightfall is an enterprise-grade operations platform for real-time telemetry, queue orchestration, server-controlled pricing, and hardware management across smart automated printing kiosk networks.

---

## 🌟 Architecture & Directory Structure

```
NIGHTFALL/
├── frontend/                      # Next.js 14 App Router, Three.js 3D Operations Center
│   ├── app/                       # Command Center, Orders, Kiosks, Incidents, Audit Logs
│   ├── components/                # 3D canvas, 2D blueprint fallback, telemetry gauges
│   ├── lib/                       # Typed API client, Socket.IO client, global AppContext
│   └── package.json
└── backend/                       # Express.js REST API, PostgreSQL, Prisma, Socket.IO
    ├── src/                       # Modules (auth, kiosks, orders, payments, simulator)
    ├── prisma/                    # Schema, migrations, seed script (12 kiosks, 3 zones)
    ├── tests/                     # Vitest automated test suite (17 passed)
    ├── docs/                      # Architecture, OpenAPI, Walkthrough, Test report
    └── package.json
```

---

## 🚀 Quick Setup & Run Instructions

### 1. Database Setup (PostgreSQL)
Ensure PostgreSQL is running on `localhost:5432`, then create the database:
```sql
CREATE DATABASE nightfall;
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies (if not already done)
npm install

# Run database migrations and seed 12 kiosks in 3 zones
npm run db:deploy
npm run db:seed

# Run automated tests
npm run test

# Start backend server (starts on http://localhost:8000)
npm run dev
```

### 3. Frontend Setup
In a separate terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Access Credentials
- **Administrator Email:** `admin@nightfall.io`
- **Password:** `nightfall-enterprise`
- One-click demo login button available directly on the login screen.

---

## 📚 Documentation
- **Interactive OpenAPI / Swagger Documentation:** `http://localhost:8000/api/docs`
- **System Architecture Diagram & Concurrency Flow:** [backend/docs/architecture.md](backend/docs/architecture.md)
- **End-to-End Walkthrough:** [backend/docs/walkthrough.md](backend/docs/walkthrough.md)
- **Automated Test Report (17/17 Passing):** [backend/docs/test-report.md](backend/docs/test-report.md)

