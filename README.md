# Spreetail — Shared Flat Expense Tracker

Spreetail is a modern, premium web application designed for flatmates and roommates to split shared bills, track expenses, record manual repayments, configure member joining/leaving timelines, and settle up with minimal transaction overhead.

The frontend is built using **React**, **TypeScript**, and **Vite** with a cohesive custom glassmorphism design system. The backend is powered by **Express.js**, **Prisma ORM**, and a **PostgreSQL** database.

---

## 🤖 AI Collaboration
This application and its visual/architectural improvements were designed, implemented, and refined in partnership with **Antigravity**, an agentic AI coding assistant built by the **Google DeepMind** team, leveraging the **Gemini 3.5 Flash (High)** model.

Key AI achievements in this codebase:
- Overhauled raw CSS into a global modern glassmorphism design system.
- Refactored page routes to utilize react-router programmatic transition states.
- Polished multi-phase progress timelines and data forms.

---

## 🛠️ Setup Instructions

### Prerequisites
Make sure you have the following installed on your machine:
- **Node.js** (version 18 or higher recommended)
- **npm** (comes packaged with Node.js)
- **PostgreSQL** database instance running locally or hosted

---

### 1. Backend Configuration & Run

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Duplicate the active `.env` file (if not present) and verify the variables:
   ```env
   # PostgreSQL Connection string
   DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<dbname>?schema=public"

   # JWT Tokens Configuration
   JWT_SECRET="supersecretjwtkey"
   REFRESH_SECRET="supersecretrefreshkey"

   # Google Authentication Credentials (Optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:5173/login"
   ```

4. Push the schema migrations to sync your PostgreSQL database structure:
   ```bash
   npx prisma db push
   ```

5. Seed the database with sample user accounts (e.g. `aisha`, `rohan`, and `priya` with password `password123`) and initial flat group expenses:
   ```bash
   npx prisma db seed
   ```

6. Start the backend development server (runs with nodemon on port `5001`):
   ```bash
   npm run dev
   ```

---

### 2. Frontend Configuration & Run

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server (runs Vite on port `5173`):
   ```bash
   npm run dev
   ```

4. *(Optional)* To build the project in production-ready static assets:
   ```bash
   npm run build
   ```

---

## 💡 Seeded Testing Accounts
Once the database has been seeded, you can log in directly using the following accounts:
- **Username / Email:** `aisha`, `rohan`, or `priya`
- **Password:** `password123`

---

## ✨ Features Highlight

- **Glassmorphic Theme**: Dark space backdrop with smooth glowing radial overlays and dynamic button scales.
- **Simplified Settle Up**: Minimizes transaction overhead, calculating the absolute minimum exchanges needed to clear flatmate debts.
- **Balance Audit Logger**: "No Magic Numbers" detail verification panel mapping out all credits (payments made), debits (splits), and settlements sent/received.
- **temporal splits**: Timeline bounds ensuring users don't split bills for months where they were inactive.
- **CSV Anomaly Wizard**: Processing timeline that scans spreadsheets for unknown payers, negative totals, duplicate transactions, and currency conversions.
