# Unconventional Framing

A cinematic film-frame annotation platform built with Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Prisma, PostgreSQL, and NextAuth.

## What is implemented

- Full-screen frame viewer with a 4-second distraction-free reveal delay.
- Metadata overlays for movie, timecode, director, DOP, and frame progress.
- Conventional, Unconventional, and Not Sure annotation buttons with optimistic save.
- Keyboard controls: left/right navigation, space metadata toggle, enter submit, escape fullscreen, and 1/2/3 answer shortcuts.
- Admin dashboard with statistics, movie breakdown chart, filters, and PDF export.
- REST endpoints for frames, annotations, statistics, movies, and export data.
- Prisma schema for users, frames, annotations, roles, and NextAuth persistence.
- SEO metadata, sitemap, robots, responsive dark UI, and accessible focus states.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000` for the cinematic annotation flow and `http://localhost:3000/admin` for the dashboard.

## Database

Set `DATABASE_URL` in `.env`, then run:

```bash
npm run prisma:generate
npm run prisma:migrate
```

The current API routes use the in-memory mock data in `lib/mock-data.ts` so the interface can run immediately. Replace those reads/writes with `prisma.frame`, `prisma.annotation`, and the authenticated user from `auth()` when connecting the production database.
