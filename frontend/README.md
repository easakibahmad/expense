# Expense — Personal Expense Tracker

A modern web app to track daily expenses and view weekly, monthly, and yearly statistics. Built with React, Vite, Tailwind CSS, GSAP, and Recharts. Uses mock data only (no backend, no login).

## Features

- **Dashboard** — Summary cards (this week / month / year) and a weekly bar chart
- **Add expense** — Form to add an expense with date, amount, category, and optional note
- **Expenses** — Filterable list (by category, date range, note search)
- **Statistics** — Period selector (week / month / year), totals, bar chart, pie chart by category, and category breakdown table

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS (v4)
- React Router
- GSAP (animations)
- Recharts (charts)

No backend, no API, no localStorage — all data is in-memory mock data that resets on refresh.
