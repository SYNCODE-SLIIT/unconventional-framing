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

## Database (MongoDB via Prisma)

Set `DATABASE_URL` in `.env` (MongoDB Atlas or a local replica set), then run:

```bash
npm run prisma:generate
npm run prisma:push   # creates collections and indexes
npm run prisma:seed   # loads the frames
```

Collections: `Participant` (name + profession from the intro screen), `Frame`, `Annotation` (one per participant per frame), plus `User`/`Account`/`Session` for admin sign-in. `lib/data.ts` is the data layer. If `DATABASE_URL` is not set, it falls back to the in-memory data in `lib/mock-data.ts`.
