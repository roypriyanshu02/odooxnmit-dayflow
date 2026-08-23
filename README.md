# Dayflow HRMS (Odoo-Inspired Enterprise Suite)

> **Dayflow HRMS** is an enterprise-grade, full-stack Human Resource Management System engineered with **SvelteKit (Svelte 5 Runes)**, **Tailwind CSS**, **Drizzle ORM**, and **SQLite**.

---

## 🚀 Key Modules & Highlights

1. **👥 Employee Directory & Odoo Profile Studio**:
   - Kanban grid with presence dots (🟢 Present, 🟡 Absent, ✈️ On Leave).
   - Dynamic standard employee ID provisioner (`OI` + `FN` + `LN` + `YYYY` + `SSSS`).
   - Multi-tab profile: *About*, *Resume*, *Private & Bank Info*, *Salary Configuration*.
   - In-app profile editor with avatar upload & preview.
   - Odoo Chatter Audit Trail widget tracking notes, salary revisions, and status transitions.

2. **⏱️ Attendance Tracking & Systray Stopwatch**:
   - Persistent navbar live stopwatch widget (`HH:MM:SS`) with check-in/out toggle.
   - Break Tracker modal with preset buttons (Coffee 15m, Lunch 45m, Rest 10m, Custom).
   - 1-hour break policy threshold warning banner.
   - Weekly Timesheet Summary strip (Monday to Sunday) with overtime calculation ($> 8.0\text{h}$).
   - Admin Company Attendance records table with UTF-8 BOM CSV export.

3. **📅 Leave Management & Approvals Portal**:
   - Dynamic quota balance cards (24 PTO, 7 Sick, Unpaid).
   - Business day calculator automatically excluding weekends.
   - Admin Leave Approval Queue with instant Approve / Reject actions.
   - Automatic attendance synchronization turning approved leave days into `on_leave` attendance records.

4. **💰 Statutory Indian Payroll Engine**:
   - Formula computation: Basic (50%), HRA (25%), Standard Allowance (₹4,167), Bonus (8.33%), LTA (8.33%), Fixed Allowance, Employee PF (12%), PT (₹200).
   - Pro-rated payable days calculation based on actual monthly attendance and unexcused absences.
   - One-click monthly batch payroll generation across departments.
   - Printable corporate salary slip with deduction breakdown, words conversion, and verification QR code.

5. **📊 Executive HR Analytics Dashboard**:
   - KPI metrics: Total Active Workforce, Present Today (%), On Leave Today, Monthly Payroll Cost (₹).
   - 7-day attendance trend chart (Present vs Absent vs On Leave).
   - Department headcount distribution progress bars.
   - Global keyboard shortcuts (`Alt+D`, `Alt+E`, `Alt+A`, `Alt+L`, `Alt+P`, `Alt+C`, `Alt+B`, `Cmd+K`, `?`).

---

## 🛠️ Quickstart & Setup

```bash
# 1. Install dependencies
bun install

# 2. Seed SQLite database with realistic multi-department records
bun run seed

# 3. Start local development server
bun dev
```

---

## 🔑 Default Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **System Admin** | `admin@dayflow.internal` | `Dayflow@2026` |
| **HR Officer** | `hr@dayflow.internal` | `Dayflow@2026` |
| **Employee** | `employee@dayflow.internal` | `Dayflow@2026` |

---

## 🧪 Testing & Quality Assurance

```bash
# Run all 13 unit, API, and E2E test suites (159+ passing tests)
bun test

# Run Svelte & TypeScript type safety check (0 errors, 0 warnings)
bun run check

# Run production build
bun run build
```

---

## 👥 Hackathon Engineering Team

| Developer | Role | GitHub Persona / Email |
| :--- | :--- | :--- |
| **Priyanshu Roy** | Lead Architect & Payroll Lead | `62667551+roypriyanshu02@users.noreply.github.com` |
| **Arnav Kini** | Frontend & Employee Directory Lead | `110757433+OctalCoder1213@users.noreply.github.com` |
| **Sanchit Kumar Pandey** | Attendance & Systray Lead | `230616838+lynzzer@users.noreply.github.com` |
| **Ankit Kumar Sah** | Leave Management Lead | `ankitsah8050@gmail.com` |

---

## 📄 License
MIT License. Built for the Odoo x NMIT Hackathon 2026.🎶
