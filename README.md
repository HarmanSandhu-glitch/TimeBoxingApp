# TimeBoxing App

A full-stack time boxing productivity app built with Next.js, featuring a visual time grid, task management, productivity analytics, journaling, and an AI assistant powered by Google Gemini.

## Features

- **Time Boxing Grid** — Visual table with hours (6 AM–11 PM) as rows and 5-minute blocks as columns. Assign tasks to cells, mark them complete.
- **Multi-Cell Selection** — Drag, Ctrl+click, or Shift+click to select multiple cells and bulk-assign a task.
- **Task Management** — Create tasks with title, priority (low/medium/high/urgent), date, and color.
- **Dashboard** — Daily productivity metrics: completion rate, focus time, priority breakdown, hourly activity charts.
- **Weekly Report** — Week-over-week stats with planned vs. completed charts and daily breakdown.
- **Off-Track Journal** — Daily journal for reflecting on what went off track with autosave.
- **AI Assistant** — Chat with Google Gemini about your productivity data, get planning suggestions.
- **Auth** — Email/password sign up with forgot/reset password, plus optional Google OAuth.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Database**: SQLite via Prisma v7 + better-sqlite3 adapter
- **Auth**: NextAuth v5 (JWT strategy)
- **AI**: Google Gemini Pro (@google/generative-ai)
- **UI**: Tailwind CSS v4, Radix UI primitives, Lucide icons
- **Charts**: Recharts
- **State**: Zustand, React hooks

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env` and fill in your values:

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | SQLite path (default: `file:./dev.db`) | Yes (pre-configured) |
| `NEXTAUTH_SECRET` | Random secret for JWT signing. Generate with `openssl rand -base64 32` | Yes |
| `NEXTAUTH_URL` | App URL (default: `http://localhost:3000`) | Yes (pre-configured) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No (for Google sign-in) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No (for Google sign-in) |
| `GEMINI_API_KEY` | Google Gemini API key from [AI Studio](https://aistudio.google.com/apikey) | Yes (for AI assistant) |
| `EMAIL_SERVER_HOST` | SMTP host (e.g. `smtp.gmail.com`) | No (for password reset emails) |
| `EMAIL_SERVER_PORT` | SMTP port (e.g. `587`) | No |
| `EMAIL_SERVER_USER` | SMTP username | No |
| `EMAIL_SERVER_PASSWORD` | SMTP password / app password | No |

### Database Setup

```bash
npx prisma migrate dev
npx prisma generate
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
app/
├── (dashboard)/          # Authenticated pages (layout with sidebar)
│   ├── home/             # Time boxing grid
│   ├── dashboard/        # Productivity analytics
│   ├── weekly-report/    # Weekly stats
│   ├── journal/          # Off-track journal
│   └── ai-assistant/     # Gemini chat
├── api/                  # API routes
│   ├── auth/             # NextAuth + signup/forgot/reset
│   ├── tasks/            # CRUD tasks
│   ├── time-blocks/      # Time block assignments
│   ├── journal/          # Journal entries
│   ├── analytics/        # Stats aggregation
│   └── ai/               # Gemini integration
├── login/                # Auth pages
├── signup/
├── forgot-password/
└── reset-password/
components/
├── TimeBoxView.tsx       # Main time grid with multi-select
├── AddTaskModal.tsx       # Task creation modal
├── BulkAssignModal.tsx    # Bulk assign to selected cells
├── Sidebar.tsx            # Navigation sidebar
└── Providers.tsx          # Session + toast providers
lib/
├── prisma.ts             # Prisma client singleton
├── auth.ts               # NextAuth configuration
├── utils.ts              # Shared utilities
└── email.ts              # Password reset emails
prisma/
├── schema.prisma         # Database models
└── migrations/           # Migration history
```

## Usage

1. **Sign up** with email and password at `/signup`
2. **Add tasks** using the + button — set title, priority, and color
3. **Assign tasks** to time blocks by clicking cells and selecting from the dropdown
4. **Bulk assign** by dragging or Ctrl/Shift+clicking multiple cells, then choosing a task
5. **Track progress** by checking off completed blocks
6. **Review stats** on the Dashboard and Weekly Report pages
7. **Journal** about what went off track each day
8. **Ask the AI** for productivity insights and day planning help
