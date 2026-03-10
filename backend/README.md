# Expense API (Backend)

REST API for the Expense app, using PostgreSQL database `expense`.

## Setup

1. Create a PostgreSQL database named `expense`:
   ```bash
   createdb expense
   ```

2. Copy env example and set your connection:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and set `DATABASE_URL` (e.g. `postgresql://user:password@localhost:5432/expense`) or individual `DB_*` variables.

3. Install and run migrations:
   ```bash
   npm install
   npm run migrate
   ```

4. Start the server:
   ```bash
   npm run dev
   ```
   API runs at `http://localhost:3001` by default.

## API

Base URL: `http://localhost:3001/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/expenses` | List expenses (query: `category`, `dateFrom`, `dateTo`, `search`) |
| GET | `/expenses/:id` | Get one expense |
| GET | `/categories` | List categories |
| POST | `/expenses` | Create expense (body: `date`, `amount`, `category`, `note?`) |
| PUT | `/expenses/:id` | Update expense |
| DELETE | `/expenses/:id` | Delete expense |

Categories: `Food`, `Transport`, `Bills`, `Shopping`, `Health`, `Entertainment`, `Other`.

## Project structure

```
backend/
├── migrations/          # SQL migrations (run in order)
├── src/
│   ├── config/          # DB connection
│   ├── controllers/     # Request handlers
│   ├── db/              # Migration runner
│   ├── middleware/      # Error handler
│   ├── routes/          # Route definitions
│   ├── types/           # Shared types & DTOs
│   ├── app.ts           # Express app
│   └── index.ts         # Entry point
├── .env.example
├── package.json
└── tsconfig.json
```
