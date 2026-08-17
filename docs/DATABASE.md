# Database Design

## Core Identity And RBAC

- `profiles` maps Supabase Auth users into application profile records.
- `roles` stores configurable role records.
- `user_roles` assigns one or more roles to users.

Initial roles are applicant, grants officer, committee member and administrator.

New Supabase Auth users are handled by `handle_new_auth_user()`, which creates a matching `profiles` row and assigns the applicant role when the seed role exists.

## Geography And Applicants

- `communities` stores Koiari, Kokoda-Biage, Kokoda-Kaina and future communities.
- `wards` and `villages` normalize location data where practical.
- `applicants` stores person-level details and contact information.

Applicant records are intentionally separate from applications. One applicant can have many yearly applications.

## Programs And Applications

- `grant_programs` defines configurable grant programs by code and year.
- `application_statuses` stores workflow states.
- `applications` stores a request by an applicant for a grant program.
- `application_status_history` records every status transition.
- `application_number_counters` supports duplicate-safe human-readable reference generation.

The initial program is `TTFSP` for 2026 with `PGK` as base currency.

## Education And Study

- `education_history` supports many secondary, tertiary or other records per applicant.
- `institutions` and `courses` normalize study providers and courses.
- `application_study_details` stores the current or proposed tertiary study for a specific application.

Money fields use `numeric(14, 2)`.

## Documents

- `document_types` stores configurable document categories.
- `program_document_requirements` maps documents to grant programs.
- `application_documents` stores metadata for uploaded files.

Binary document data belongs in Backblaze B2, not PostgreSQL.

## Eligibility

- `eligibility_rules` stores program-year rules with community scope, priority, tuition support percentage, effective dates and JSONB condition data.
- `application_eligibility_assessments` records assessment outcomes.
- `application_applied_rules` records which rules were applied to an application assessment.

This keeps yearly rule changes auditable and data-driven.

## Committee Review

- `committees`
- `committee_members`
- `committee_meetings`
- `committee_reviews`

Applications may receive multiple reviews. Recommendations and final decisions are not stored as a single boolean.

## Restrictions, Funding And Audit

- `applicant_restrictions` supports failure-related or other sponsorship exclusions.
- `funding_awards` stores approved tuition support and grant amount details.
- `payment_batches` and `payments` prepare for institution payment tracking.
- `audit_logs` records important administrative, financial and security-sensitive actions.

## Deletion Strategy

Application, funding, review and audit history should not be casually cascade-deleted. Foreign keys generally restrict deletion or set actor references to null where retaining history is more important than retaining a user link.
