# 🌙 Project Nightfall — Smart Printing Operations Platform

**An intelligent, interactive 3D command center for managing smart printing operations, print kiosks, document orders, payments, and real-time printing workflows.**

---

## 📌 Project Overview

Project Nightfall is a smart printing operations platform designed to simplify and manage printing services through a centralized digital command center.

The platform provides an interactive 3D visualization of printing kiosks, document upload and order creation, simulated payment processing, kiosk job management, and printing progress monitoring.

It aims to connect customers, administrators, and printing kiosks through a centralized application with secure authentication, database-backed operations, and real-time status updates.

## 🎯 Project Objectives

- Develop a centralized smart printing management platform.
- Visualize printing kiosks through an interactive 3D command center.
- Manage multiple kiosks distributed across different zones.
- Provide a complete document upload and print-order workflow.
- Support simulated payment processing.
- Manage kiosk job assignment and printing operations.
- Monitor order progress and kiosk availability.
- Maintain secure authentication and administrative audit records.
- Improve operational visibility and reliability.

## ✨ Key Features

### 1. Authentication and User Management

- User registration and login.
- Secure password hashing.
- JWT-based authentication.
- Role-based access control.
- Administrator and customer account management.
- Demo authentication support for development environments.
- Password recovery workflow (subject to configured reset-token and email functionality).

### 2. Interactive 3D Command Center

- Interactive 3D kiosk visualization.
- Multiple printing kiosks distributed across three operational zones.
- Kiosk selection and status visualization.
- Zone and status filtering.
- Camera zoom, pan, and navigation.
- Fit View and 2D/3D viewing modes where implemented.
- Kiosk information and operational monitoring.

### 3. Document Management

- Document upload interface.
- Drag-and-drop file selection.
- Supported document format validation.
- Document metadata and page information.
- Print specification configuration.
- Secure document access.

### 4. Print Order Management

- Create and manage printing orders.
- Configure number of copies.
- Select color or monochrome printing.
- Choose paper size.
- Configure single-sided or duplex printing.
- Select destination kiosk.
- Review estimated print charges.
- Track order status and printing progress.

### 5. Payment Simulation

- Simulated payment workflow.
- Payment status tracking.
- Order and payment record management.
- Duplicate payment-event protection where implemented.
- Payment and transaction history.

### 6. Kiosk and Job Management

- Kiosk status monitoring.
- Job assignment and claiming.
- Print job progress tracking.
- Job completion and failure handling.
- Job attempt tracking.
- Retry and recovery handling.
- Kiosk authorization and revocation.

### 7. Order Details and Receipts

- Detailed order information.
- Assigned kiosk information.
- Printing progress monitoring.
- Order activity timeline.
- Receipt PDF generation and download.
- Reprint request functionality.

### 8. Administration and Audit Logs

- Centralized operational monitoring.
- Administrative audit records.
- User and kiosk activity tracking.
- Order and job activity monitoring.
- Security-related event tracking.

---

## 🛠️ Technology Stack

The project uses the following technologies, subject to the actual installed dependencies in the repository.

| Category | Technology |
|---|---|
| Frontend | React / TypeScript |
| Backend | Node.js |
| Backend Language | TypeScript |
| API | REST API |
| Database | PostgreSQL (if configured) |
| ORM | Prisma |
| Authentication | JWT |
| Password Security | Node.js Crypto / scrypt |
| 3D Visualization | Three.js / React Three Fiber (if configured) |
| Real-Time Communication | WebSocket / Socket.IO (if configured) |
| Testing | Project-configured test framework |
| Development Tools | Visual Studio Code, Git, Postman |

## 🏗️ System Architecture

The platform follows a frontend-backend architecture.

```text
                 PROJECT NIGHTFALL
                         |
          +--------------+--------------+
          |                             |
     FRONTEND                       BACKEND
          |                             |
   React / TypeScript              Node.js / TypeScript
          |                             |
   +------+-------+              +------+-------+
   |              |              |              |
3D Command     Order UI       Authentication   REST APIs
Center         Dashboard      & Authorization      |
   |              |              |                |
   +--------------+--------------+                |
                         |                         |
                    DATABASE                 JOB PROCESSING
                         |                         |
                      Prisma                  Printing Kiosks
                         |                         |
                    PostgreSQL              Job Status Updates
                         |                         |
                         +-----------+-------------+
                                     |
                              REAL-TIME UPDATES
```

## 📂 Project Structure

The exact folder structure may vary depending on the implementation.

```text
NIGHTFALL/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── assets/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── utils/
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │
│   └── package.json
│
├── tests/
│
├── .env.example
├── .gitignore
└── README.md
```

Update this structure to match the actual repository if your project uses a different layout.

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following tools:

- Node.js (compatible with the project's dependencies).
- npm.
- PostgreSQL, if PostgreSQL is configured as the database.
- Visual Studio Code.
- Git.

### Step 1 — Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd NIGHTFALL
```

### Step 2 — Install Dependencies

Install dependencies in the root directory:

```bash
npm install
```

If frontend and backend are separate applications, install dependencies in each directory:

```bash
cd frontend
npm install
```

```bash
cd ../backend
npm install
```

Use the actual package.json files to determine which directories require installation.

### Step 3 — Configure Environment Variables

Create a `.env` file using the provided `.env.example`.

Example configuration:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/nightfall"
JWT_SECRET="REPLACE_WITH_A_STRONG_RANDOM_SECRET"
ALLOW_DEMO_AUTH="false"
```

Additional variables may be required depending on the configured frontend, backend, file storage, and real-time services.

**Security:** Never commit `.env` files, database passwords, JWT secrets, or API keys to GitHub.

### Step 4 — Database Setup

Make sure your database is running and the `DATABASE_URL` points to the correct database.

Check the installed Prisma version:

```bash
npm ls prisma @prisma/client
```

Validate the schema if the project uses Prisma:

```bash
npx prisma validate
```

Apply existing migrations using the command supported by your installed Prisma version and project configuration.

For a Prisma 7 project, the migration command may differ from older Prisma versions. Check the project's Prisma documentation and migration history before running it.

Do not use database reset commands on an existing database without a backup.

### Step 5 — Start the Application

Check the `scripts` section of the relevant `package.json` files.

For a project with a development script:

```bash
npm run dev
```

If frontend and backend are separate, start each using its configured development script in separate terminals.

Open the local frontend URL displayed in the terminal.

---

## 🔄 Application Workflow

The main printing workflow is designed around the following steps:

```text
User Registration / Login
          |
          v
   3D Command Center
          |
          v
   Select Printing Kiosk
          |
          v
   Upload Document
          |
          v
   Configure Print Settings
          |
          v
     Review Quote
          |
          v
   Simulated Payment
          |
          v
    Order Confirmation
          |
          v
     Kiosk Job Claim
          |
          v
   Printing Progress
          |
          v
   Job Completion / Failure
          |
          v
    Order Status Update
```

## 🖨️ Printing Workflow

The platform is designed to support a printing simulator for demonstrating kiosk operations without requiring physical printer hardware.

The simulator can manage:

- Job claiming.
- Printing progress.
- Job status transitions.
- Successful completion.
- Failed printing attempts.
- Retry handling.
- Job history and timestamps.

Physical printer integration requires additional hardware and driver configuration.

## 🔐 Security Considerations

The platform incorporates security-oriented design practices, including:

- Password hashing.
- JWT authentication.
- Server-side authorization.
- Input validation.
- Secure document access.
- Server-side price calculation.
- Duplicate payment-event protection.
- Concurrency-safe job claiming.
- Kiosk identity verification.
- Audit logging.

Actual security depends on the implementation and must be verified through automated tests and security reviews.

## 🧪 Testing

Run the test commands configured in the project.

Typical examples:

```bash
npm test
```

```bash
npm run lint
```

```bash
npm run build
```

If configured, verify:

- Authentication and authorization.
- User registration.
- Order creation.
- Document upload validation.
- Server-side pricing.
- Payment processing.
- Kiosk authorization.
- Concurrent job claims.
- Printing state transitions.
- Receipt generation.
- Real-time updates.
- Failure and recovery scenarios.

Only report tests as passed when they have actually been executed successfully.

## 📡 API Documentation

The backend exposes API endpoints for application operations.

Document the actual endpoints implemented in the repository.

Suggested API groups:

| Module | Responsibility |
|---|---|
| Authentication | Registration, login, logout and account management |
| Users | User profile and administration |
| Kiosks | Kiosk listing, details and status |
| Orders | Order creation, listing and details |
| Documents | Document upload and retrieval |
| Payments | Simulated payment processing |
| Jobs | Job claiming, progress and completion |
| Receipts | Receipt PDF generation |
| Audit Logs | Administrative activity records |

## 🚀 Future Enhancements

- Physical printer hardware integration.
- Advanced kiosk health monitoring.
- Automated printer maintenance alerts.
- Enhanced analytics and reporting.
- Multi-location printing management.
- Production payment provider integration.
- Advanced document processing.
- Cloud deployment and scalable job processing.

## 👨‍💻 Development and Contribution

Contributions and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Run the relevant tests.
5. Submit a pull request.

## 📄 Project Information

**Project Name:** Project Nightfall

**Project Type:** Smart Printing Operations Platform

**Project Category:** Full-Stack Web Application / 3D Interactive System

**Primary Purpose:** Digital management, monitoring, and automation of smart printing operations.

**Development Environment:** Visual Studio Code

**Documentation:** README.md

---

## ⚠️ Important Notes

- This project may use simulated payment and printing services for demonstration.
- Actual integrations depend on the configured services and credentials.
- Environment variables must be configured before running the application.
- Database migrations should be reviewed before applying them.
- Features should be considered complete only after successful functional testing.

---

**Project Nightfall — Intelligent Printing. Connected Operations. Smarter Management.**
