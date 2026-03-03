# FullyFulfilled

A habit tracker with RPG mechanics. Your life areas are stats. Log habits to maintain them. Miss too many and they decay. Let one hit zero and face a consequence.

## Stack

- **Next.js 16** — frontend + API routes
- **Prisma + PostgreSQL** — data layer
- **Clerk** — authentication
- **Tailwind CSS** — styling

## Data Model

- `User` → `Character` → `Stats` (one per life area: Health, Discipline, Knowledge, Social, Creativity, Finance)
- Each `Stat` is fed by one or more `Habits`
- Missing habits increments `missedStreak` on the habit → triggers `DecayEvent` on the parent stat after a grace period
- A stat hitting 0 creates a `Consequence`
- All notable events are logged to `Event`

## Local Setup

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Clone and install

```bash
git clone git@github.com:faetrap/fullyfulfilled.git
cd fullyfulfilled
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fullyfulfilled?schema=public"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
```

Get Clerk keys at [clerk.com](https://clerk.com) → create a new app → API Keys.

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── character/   # character creation + retrieval
│   │   ├── habits/      # habit management
│   │   └── checkin/     # daily check-in
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts            # Prisma client singleton
│   ├── decay.ts         # decay engine logic
│   └── constants.ts
└── middleware.ts         # Clerk auth middleware
prisma/
└── schema.prisma
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
