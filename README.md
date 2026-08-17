# GMS - Grant Management System

GMS is a production-oriented web application foundation for managing education grant programs. The first configured use case is the 2026 Tertiary Tuition Fees Support Project, but the schema and UI structure are designed so future grant programs can be added without rewriting the application around one scheme.

The eventual application URL is `https://gms.bitauney.com`.

## Stack

- React, TypeScript, Vite, React Router
- Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security and migrations
- Backblaze B2 for private document object storage through a future server-side API
- Zod for validation foundations
- ESLint, Prettier and Vitest

## Local Development

Prerequisites:

- Node.js 24 or newer
- npm
- Supabase CLI for local database work

Install dependencies:

```sh
npm install
```

Create a local environment file:

```sh
cp .env.example .env
```

Only `VITE_*` values are safe for browser-side code. Do not place `SUPABASE_SERVICE_ROLE_KEY` or Backblaze secrets in React code.

Run the app:

```sh
npm run dev
```

Validate the project:

```sh
npm run lint
npm run test
npm run build
```

## Supabase Setup

The schema lives in `supabase/migrations`.

Seed data lives in `supabase/seed.sql` and includes:

- initial roles
- Koiari, Kokoda-Biage and Kokoda-Kaina communities
- the 2026 TTFSP grant program
- application statuses
- document types and requirements
- representative eligibility rules

Use the Supabase CLI or dashboard migration tooling to apply the migration and seed data. Do not commit real Supabase service-role credentials.

## Deployment Overview

Planned delivery path:

Namecheap -> Cloudflare -> GMS application at `gms.bitauney.com`

Cloudflare will manage DNS, SSL and delivery. The app is not tightly coupled to a single hosting vendor in Phase 1.

## Project Structure

- `src/app` - app-level navigation/configuration
- `src/components` - reusable UI components
- `src/features` - domain feature modules
- `src/layouts` - shared layout shells
- `src/lib` - environment and Supabase client helpers
- `src/pages` - route-level pages
- `src/services` - storage and external service abstractions
- `src/types` - shared TypeScript domain types
- `supabase` - migrations and seed data
- `docs` - architecture, database and roadmap notes

## Current Phase

Phase 1 is a foundation only. The full applicant wizard, authentication screens, review queues and file upload backend should be implemented in later phases.
