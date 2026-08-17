# GMS Roadmap

## Phase 1 - Foundation

Status: complete in this repository foundation.

- Vite React TypeScript app
- Tailwind CSS
- React Router
- strict TypeScript
- ESLint, Prettier and Vitest
- reusable source structure
- Supabase client abstraction
- Backblaze storage interface and placeholder
- initial application shell
- applicant and staff dashboard placeholders
- Supabase foundational migration
- seed/configuration SQL
- README and architecture/database/roadmap docs

## Phase 2 - Authentication And Applicant Profile

Status: in progress in the current branch.

- Supabase Auth setup
- sign in, sign out and session handling
- profile creation flow
- applicant personal and contact details
- role-aware navigation from real user roles
- RLS verification tests for applicant privacy

## Phase 3 - Application Wizard

- autosave-friendly draft application
- education history forms
- current study details
- community and eligibility input capture
- review and declaration step
- safe application submission and reference generation

## Phase 4 - Documents

- server-side Backblaze B2 upload endpoint
- required document checklist
- upload status tracking
- secure temporary document access
- staff document verification workflow

## Phase 5 - Staff Review And Eligibility

- review queues
- eligibility assessment UI
- applied rule audit trail
- status transitions and information requests
- internal notes and audit logging

## Phase 6 - Committee And Decisions

- committees and membership management
- meeting records
- committee review screens
- recommendations and final decision workflow

## Phase 7 - Funding And Reporting

- funding awards
- payment batches and payments
- dashboards and exports
- reports by community, status, institution and program year
