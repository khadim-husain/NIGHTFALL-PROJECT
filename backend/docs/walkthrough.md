# Project Nightfall — End-to-End Demonstration Walkthrough

This guide details the complete end-to-end operational flow from customer submission to kiosk queue dispatch, simulated payment, hardware execution, and real-time dashboard monitoring.

---

## 🚀 Step 1: Administrator & User Login

1. Open the frontend at `http://localhost:3000/login`.
2. Click **One-Click Demo Access** or enter the administrative credentials:
   - **Email:** `admin@nightfall.io`
   - **Password:** `nightfall-enterprise`
3. Click **Sign In**.
4. The frontend authenticates via `POST /api/v1/auth/login`, receives a signed cryptographic session token, and securely stores it in localStorage.
5. The router redirects to `/command-center`.

---

## 📊 Step 2: Command Center & Fleet Telemetry

1. Navigate to `/command-center`.
2. Notice the live KPI counters:
   - **12 Connected Kiosks** across **3 Operating Zones** (Zone A: Front Lobby, Zone B: Main Floor, Zone C: Production).
   - High fleet availability and active print queue summary.
3. Interact with the **3D Operations Center**:
   - Orbit, zoom, and click on **K05** (Floor Center 1) or any kiosk from **K01** to **K12**.
   - The inspection card updates synchronously with core temperature, ink, paper percentage, and current spooled document.
   - Switch to **2D Blueprint Fallback** to view the architectural schematic.

---

## 📄 Step 3: Document Upload & Preflight Validation

1. Navigate to **New Order** (`/orders/new`).
2. Drag and drop a document (PDF, DOCX, PPTX, PNG, or JPG) or use the pre-loaded executive briefing.
3. The server validates the format, detects MIME type, enforces size limits (max 50 MB), generates an HMAC-protected storage key, and writes the object to private storage.

---

## 💰 Step 4: Server-Side Pricing Verification

1. In Step 2 (Print Configuration), select:
   - **Copies:** 2
   - **Color Mode:** Color ($0.35/page)
   - **Paper Size:** A4 (1.0x multiplier)
   - **Duplex:** Enabled
   - **Destination Kiosk:** K05
2. The server-controlled pricing engine calculates the quote:
   $$\text{Subtotal} = 14 \text{ pages} \times 2 \text{ copies} \times \$0.35 = \$9.80$$
   $$\text{Tax (8\%)} = \$9.80 \times 0.08 = \$0.78$$
   $$\text{Total} = \$10.58$$
3. Any attempt by a client to tamper with the total amount payload is automatically discarded; the backend enforces its authoritative calculation.

---

## 💳 Step 5: Simulated Payment & Idempotency Check

1. In Step 3 (Review & Pay), click **Authorize & Execute Payment**.
2. The frontend generates a unique idempotency key (e.g. `idemp_pay_...`) and dispatches `POST /api/v1/payments/simulate`.
3. The server executes a database transaction:
   - Creates a `Payment` record in `SUCCEEDED` status.
   - Transitions the `Order` from `Pending` to `Queued`.
   - Increments the target kiosk's queue counter.
   - Creates an authoritative `PrintJob` in `QUEUED` status.
   - Emits a real-time event to connected Socket.IO clients.
4. **Idempotency Guarantee:** If the user double-clicks or retries after a network blip, the server returns the existing transaction with `idempotentReplay: true` without double charging or creating a duplicate job.
5. Celebration confetti fires and the user receives their confirmed Order ID (`#NF-XXXX`).

---

## 🖨️ Step 6: Atomic Kiosk Job Claiming & Print Simulation

1. The Kiosk Worker API (`POST /api/v1/kiosks/K05/jobs/claim`) claims the queued job:
   - Atomically updates `status = CLAIMED` with a 5-minute lease expiration.
   - Secures the job with version sequence locking so no other kiosk can claim it.
2. The background **Print Queue Simulator** advances the job's progress by +15% every tick.
3. Real-time Socket.IO broadcasts `job:progress` events:
   - The customer's order tracking timeline updates live.
   - The Command Center dashboard progress bar advances.
4. Upon reaching 100%, the job transitions to `COMPLETED`, the kiosk queue counter decrements, and total prints counter increments.

---

## 🚨 Step 7: Incident Triage & Resolution

1. Navigate to `/incidents`.
2. Inspect active alerts, such as **INC-402** (Paper jam in Tray 2 on K12).
3. Click **Resolve Incident**.
4. The server executes `POST /api/v1/incidents/INC-402/resolve`, updates the record status, writes an immutable audit log, and restores K12 back to `Online` status.
5. Notice the kiosk status halo immediately turns healthy in the 3D Command Center!

