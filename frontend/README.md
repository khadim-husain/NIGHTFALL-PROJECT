# Nightfall Nexus — Smart Printing Operations & Kiosk Management Platform

> **Premium Light-Theme Enterprise Operations Center**  
> Reproducing and extending the reference architecture for next-generation smart printing facilities.

---

## 🌟 Overview

**Nightfall Nexus** is a state-of-the-art enterprise SaaS operations platform built for real-time monitoring, telemetry, and queue orchestration across automated printing kiosk networks. 

Built strictly with a **premium light UI design system**, crisp typography, subtle elevation shadows, and an interactive **Three.js / React Three Fiber 3D Operations Center**, Nightfall Nexus gives operations controllers complete situational awareness across all 12 smart kiosks and 3 operating zones.

---

## 📐 Visual & Architecture Highlights

- **Strict Premium Light Theme**:
  - Main Background: `#F4F7FB`
  - Cards & Surfaces: `#FFFFFF`
  - Primary Accent Blue: `#2563EB`
  - Text: Dark Navy `#10234F` & Slate `#64748B`
  - Operating Zones: Zone A (Blue / Front Lobby), Zone B (Violet / Main Floor), Zone C (Teal / Production)
- **Interactive 3D Operations Center**:
  - Built with **Three.js** and **React Three Fiber**.
  - Procedural smart facility floor plan with neon perimeter zone platforms, glass partitions, and mezzanine operations command bridge.
  - 12 individual procedural kiosks (K01–K12) with real-time status halos (Online, Idle, Busy, Warning, Error) and interactive click selection.
  - Zoom controls, pan navigation, camera orbit controls, and an instant **2D Architectural Blueprint Fallback mode**.
- **Real-time Selected Kiosk Telemetry**:
  - Live inspection card updating synchronously upon selecting any kiosk in 3D or 2D.
  - Displays document progress, estimated completion, core temperature, ink, and paper levels.
- **Full Application Lifecycle**:
  - **Command Center**: The primary master dashboard reproducing the reference design.
  - **Orders Management**: Searchable, filterable ledger with live status pills and pagination.
  - **Create Order**: Drag-and-drop document upload with preflight verification, print settings, live price quote calculator, simulated payment sandbox, and confetti confirmation.
  - **Order Details**: Timeline of event milestones, specs, and receipt export.
  - **Kiosks Management**: Grid and table view toggle for all 12 kiosks with soft reboot diagnostics.
  - **Kiosk Details**: Deep telemetry gauges (fuser temperature, paper tray, CMYK toner, uptime, firmware).
  - **Incidents Response**: Triage paper stalls and thermal alerts with 1-click issue resolution.
  - **Audit Logs**: Immutable system ledger with searchable actor trails and JSON payload inspector.
  - **Settings**: Administrator profile, notification thresholds, fleet pricing rules, and system info.
  - **Authentication**: Premium light-mode login screen with 1-click demo access.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Charts & Telemetry**: Recharts
- **Celebration Effects**: Canvas Confetti

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js `v18.x` or higher (tested on Node `v22.x`)
- npm or yarn

### 2. Installation
```bash
# Clone the repository
git clone <repo-url>
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the provided environment template:
```bash
cp .env.example .env.local
```
*(Optional) If you have a live backend running, set `NEXT_PUBLIC_API_URL=http://localhost:8000`. If left empty, the application runs seamlessly in self-contained high-fidelity Demo Mode.*

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                # Root layout with ClientProviders & light theme enforcement
│   ├── page.tsx                  # Root redirecting to Command Center
│   ├── command-center/           # Master reference dashboard
│   ├── orders/                   # Orders list & management
│   │   ├── [id]/                 # Deep order timeline & receipt
│   │   └── new/                  # Drag-and-drop upload & simulated payment
│   ├── kiosks/                   # Kiosk fleet grid & table view
│   │   └── [id]/                 # Kiosk hardware telemetry & queue
│   ├── incidents/                # Incident triage & 1-click resolution
│   ├── audit-logs/               # Immutable admin event log & JSON inspector
│   ├── settings/                 # Fleet policies, notifications, and profile
│   └── login/                    # Light-theme authentication screen
├── components/
│   ├── layout/                   # Sidebar, TopNavbar, AppLayout
│   ├── dashboard/                # KPI cards, 3D Canvas, 2D Blueprint, Charts, Tables
│   ├── ui/                       # Brand logo and reusable components
│   └── providers/                # Client-side context providers
├── lib/
│   ├── types.ts                  # Typed TypeScript data models
│   ├── mock-data.ts              # Consistent demo dataset matching reference
│   ├── api-client.ts             # Centralized API client with fallback
│   └── AppContext.tsx            # Global application state management
└── tailwind.config.ts            # Precision color tokens and shadows
```

---

## 🛡️ License
Nightfall Nexus Enterprise Platform. All rights reserved.
