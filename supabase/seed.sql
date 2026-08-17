insert into public.roles (code, name, description)
values
  ('applicant', 'Applicant', 'Can manage their own profile and grant applications.'),
  ('grants_officer', 'Grants Officer', 'Can review applications, verify documents, and assess eligibility.'),
  ('committee_member', 'Committee Member', 'Can review assigned applications and enter recommendations.'),
  ('administrator', 'Administrator', 'Can configure programs, users, roles, reporting, and system settings.')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description;

insert into public.communities (name, code)
values
  ('Koiari', 'KOIARI'),
  ('Kokoda-Biage', 'KOKODA_BIAGE'),
  ('Kokoda-Kaina', 'KOKODA_KAINA')
on conflict (code) do update
set name = excluded.name;

insert into public.application_statuses (code, name, sort_order, is_terminal)
values
  ('draft', 'Draft', 10, false),
  ('submitted', 'Submitted', 20, false),
  ('initial_review', 'Initial Review', 30, false),
  ('information_required', 'Information Required', 40, false),
  ('document_verification', 'Document Verification', 50, false),
  ('eligibility_review', 'Eligibility Review', 60, false),
  ('ready_for_committee', 'Ready for Committee', 70, false),
  ('committee_review', 'Committee Review', 80, false),
  ('pending', 'Pending', 90, false),
  ('approved', 'Approved', 100, true),
  ('not_approved', 'Not Approved', 110, true),
  ('withdrawn', 'Withdrawn', 120, true),
  ('closed', 'Closed', 130, true)
on conflict (code) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_terminal = excluded.is_terminal;

insert into public.grant_programs (
  code,
  name,
  description,
  program_year,
  status,
  base_currency
)
values (
  'TTFSP',
  'Tertiary Tuition Fees Support Project',
  'Initial tertiary tuition fee support grant program configuration for development.',
  2026,
  'draft',
  'PGK'
)
on conflict (code, program_year) do update
set name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    base_currency = excluded.base_currency;

insert into public.document_types (code, name, description)
values
  ('cover_letter', 'Cover Letter / Project Application Form', 'Applicant cover letter or official project application form.'),
  ('resume', 'Resume / Curriculum Vitae', 'Applicant resume or CV.'),
  ('photo', 'Recent Applicant Photograph', 'Recent photo for applicant identity records.'),
  ('acceptance_letter', 'Acceptance Letter', 'Acceptance letter from tertiary institution.'),
  ('statement_of_account', 'Certified Statement of Account', 'Certified statement of account from tertiary institution.'),
  ('course_fee_schedule', 'Course Fee Schedule', 'Institution course fee schedule.'),
  ('progressive_results', 'Progressive Academic Results', 'Academic results for continuing students.'),
  ('other_requested', 'Other Requested Document', 'Additional document requested by an administrator.')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description;

insert into public.program_document_requirements (
  grant_program_id,
  document_type_id,
  requirement_level,
  student_type,
  condition_data
)
select gp.id, dt.id, requirement_level, student_type, condition_data
from public.grant_programs gp
cross join lateral (
  values
    ('cover_letter', 'required', 'all', '{}'::jsonb),
    ('resume', 'required', 'all', '{}'::jsonb),
    ('photo', 'required', 'all', '{}'::jsonb),
    ('acceptance_letter', 'required', 'all', '{}'::jsonb),
    ('statement_of_account', 'required', 'all', '{}'::jsonb),
    ('course_fee_schedule', 'required', 'all', '{}'::jsonb),
    ('progressive_results', 'conditional', 'continuing', '{"student_type":"continuing"}'::jsonb),
    ('other_requested', 'optional', 'all', '{}'::jsonb)
) as req(document_code, requirement_level, student_type, condition_data)
join public.document_types dt on dt.code = req.document_code
where gp.code = 'TTFSP' and gp.program_year = 2026
on conflict (grant_program_id, document_type_id, student_type) do update
set requirement_level = excluded.requirement_level,
    condition_data = excluded.condition_data,
    active = true;

insert into public.eligibility_rules (
  rule_code,
  grant_program_id,
  program_year,
  community_id,
  priority,
  description,
  tuition_support_percentage,
  geographical_applicability,
  condition_data,
  active,
  effective_from
)
select rules.rule_code, gp.id, 2026, c.id, rules.priority, rules.description,
       rules.tuition_support_percentage, rules.geographical_applicability,
       rules.condition_data, true, date '2026-01-01'
from public.grant_programs gp
cross join lateral (
  values
    (
      'R1',
      'KOIARI',
      1,
      '100% tuition support for eligible landowners children attending a PNG tertiary institution.',
      100.00,
      '{"institution_country":"PG"}'::jsonb,
      '{"applicant_category":"eligible_landowner_child","excluded_fees":["accommodation","boarding","lodging","other"]}'::jsonb
    ),
    (
      'R2',
      'KOIARI',
      2,
      '70% tuition support for eligible students from specified track corridor or surrounding communities.',
      70.00,
      '{"community_scope":"track_corridor_or_surrounding"}'::jsonb,
      '{"excluded_fees":["accommodation","boarding","lodging","other"]}'::jsonb
    ),
    (
      'R3',
      'KOIARI',
      3,
      'Accommodation, boarding, lodging and other fees are excluded from tuition sponsorship.',
      0.00,
      '{}'::jsonb,
      '{"exclusion_rule":true,"excluded_fees":["accommodation","boarding","lodging","other"]}'::jsonb
    ),
    (
      'R4',
      'KOIARI',
      4,
      'No overseas course-fee sponsorship.',
      0.00,
      '{"institution_country":"not_PG"}'::jsonb,
      '{"exclusion_rule":true}'::jsonb
    ),
    (
      'R5',
      'KOIARI',
      5,
      'Two-year non-sponsorship penalty may apply to students who fail their course.',
      0.00,
      '{}'::jsonb,
      '{"restriction_type":"course_failure","default_duration_years":2}'::jsonb
    ),
    (
      'KB-P1',
      'KOKODA_BIAGE',
      1,
      'Priority Category 1 tuition support based on configured landowner relationship conditions.',
      100.00,
      '{}'::jsonb,
      '{"priority_category":1,"configurable":true}'::jsonb
    ),
    (
      'KB-P2',
      'KOKODA_BIAGE',
      2,
      'Priority Category 2 tuition support based on configured landowner relationship conditions.',
      70.00,
      '{}'::jsonb,
      '{"priority_category":2,"configurable":true}'::jsonb
    ),
    (
      'KB-P3',
      'KOKODA_BIAGE',
      3,
      'Priority Category 3 tuition support based on configured landowner relationship conditions.',
      50.00,
      '{}'::jsonb,
      '{"priority_category":3,"configurable":true}'::jsonb
    ),
    (
      'KK-P1',
      'KOKODA_KAINA',
      1,
      'Priority Category 1 support for configured landowner relationship and PNG tertiary study.',
      100.00,
      '{"institution_country":"PG"}'::jsonb,
      '{"priority_category":1,"configurable":true}'::jsonb
    ),
    (
      'KK-P2',
      'KOKODA_KAINA',
      2,
      'Priority Category 2 support for proclaimed ward residency and PNG tertiary study.',
      50.00,
      '{"institution_country":"PG","ward_scope":"proclaimed"}'::jsonb,
      '{"priority_category":2,"configurable":true}'::jsonb
    ),
    (
      'KK-P3',
      'KOKODA_KAINA',
      3,
      'Priority Category 3 support using configured residency, study and failure-history conditions.',
      50.00,
      '{"institution_country":"PG"}'::jsonb,
      '{"priority_category":3,"default_failure_restriction_years":2,"configurable":true}'::jsonb
    )
) as rules(rule_code, community_code, priority, description, tuition_support_percentage, geographical_applicability, condition_data)
join public.communities c on c.code = rules.community_code
where gp.code = 'TTFSP' and gp.program_year = 2026
on conflict (grant_program_id, rule_code) do update
set community_id = excluded.community_id,
    priority = excluded.priority,
    description = excluded.description,
    tuition_support_percentage = excluded.tuition_support_percentage,
    geographical_applicability = excluded.geographical_applicability,
    condition_data = excluded.condition_data,
    active = true;
