# GMS Architecture

## Overview

GMS uses React as the interface, Supabase as the system of record, and Backblaze B2 as the eventual private object store for supporting documents.

The deployment target is `gms.bitauney.com` behind Cloudflare.

## Client

The React app is built with Vite, TypeScript, React Router and Tailwind CSS. The current application shell supports applicant and staff navigation placeholders so Phase 2 can add authenticated, role-dependent views without replacing the layout.

The browser may use:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The browser must never receive:

- Supabase service-role keys
- Backblaze B2 key ID or application key
- private document URLs without short-lived authorization

## Authentication And Authorization

Supabase Auth will own identity. Public profile records map Supabase users into GMS roles through `profiles`, `roles` and `user_roles`.

Authorization must be enforced in the database through Row Level Security and supporting server APIs. React may hide navigation items for usability, but it is not an authorization boundary.

Phase 2 adds:

- applicant registration and sign-in screens
- a session-aware `AuthProvider`
- protected routes
- a database trigger that creates `profiles` records for new Auth users
- default applicant role assignment
- a role-code RPC used by the frontend navigation

## Database

PostgreSQL is the system of record for:

- applicants and profiles
- grant programs and application years
- applications and status history
- education and study details
- document metadata
- eligibility rules and applied rule history
- committee reviews
- restrictions
- funding awards and payments
- audit logs

Financial values use `numeric`, not floating point.

## Storage

Document files will be stored in Backblaze B2, while PostgreSQL stores metadata such as filename, MIME type, size, object key, verification status and audit details.

Phase 1 includes a `DocumentStorageService` interface and a Backblaze placeholder. Real uploads should be handled by a secure server-side API or edge function so B2 credentials are never bundled into the frontend.

## Application Workflow

Applications use lookup-driven statuses and an `application_status_history` table. Status changes should append history rather than overwriting important workflow context.

Submitted applications receive a human-readable reference number like `GMS-2026-000001`. UUIDs remain the internal primary keys.

## Security Boundaries

Security principles:

- least privilege access
- RLS on private tables
- no service-role key in frontend code
- no Backblaze secrets in frontend code
- private file storage and temporary download access
- audit logs for sensitive administrative and financial actions
- database constraints for system-of-record validation

## Deployment

The planned architecture is:

Namecheap -> Cloudflare -> application host

Cloudflare should manage DNS and SSL for `gms.bitauney.com`. The application remains host-agnostic in Phase 1 so the final provider can be selected later.
