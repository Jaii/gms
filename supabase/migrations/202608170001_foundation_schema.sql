create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role_id)
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  llg text,
  district text,
  province text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, llg, district, province)
);

create table public.villages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete restrict,
  ward_id uuid references public.wards(id) on delete restrict,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, community_id, ward_id)
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code char(2) not null default 'PG',
  institution_type text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, country_code)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete restrict,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (institution_id, name)
);

create table public.applicants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  first_name text not null,
  middle_name text,
  surname text not null,
  date_of_birth date,
  sex text,
  clan text,
  community_id uuid references public.communities(id) on delete restrict,
  village_id uuid references public.villages(id) on delete restrict,
  ward_id uuid references public.wards(id) on delete restrict,
  residential_address text,
  postal_address text,
  telephone text,
  mobile_phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grant_programs (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  program_year integer not null,
  opening_date date,
  closing_date date,
  status text not null default 'draft',
  base_currency char(3) not null default 'PGK',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (code, program_year),
  constraint grant_program_year_check check (program_year between 2000 and 2100)
);

create table public.application_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  sort_order integer not null unique,
  is_terminal boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.application_number_counters (
  program_year integer primary key,
  next_value integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete restrict,
  grant_program_id uuid not null references public.grant_programs(id) on delete restrict,
  status_id uuid not null references public.application_statuses(id) on delete restrict,
  application_number text unique,
  sequence_number integer,
  additional_information text,
  submitted_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (applicant_id, grant_program_id),
  constraint application_number_format check (
    application_number is null or application_number ~ '^GMS-[0-9]{4}-[0-9]{6}$'
  )
);

create table public.application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  previous_status_id uuid references public.application_statuses(id) on delete restrict,
  new_status_id uuid not null references public.application_statuses(id) on delete restrict,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);

create table public.education_history (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete restrict,
  education_level text not null,
  grade_level text,
  school_name text,
  course text,
  institution_id uuid references public.institutions(id) on delete restrict,
  year_graduated integer,
  award text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint education_level_check check (education_level in ('secondary', 'tertiary', 'other'))
);

create table public.application_study_details (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete restrict,
  institution_id uuid references public.institutions(id) on delete restrict,
  course_id uuid references public.courses(id) on delete restrict,
  proposed_course text,
  duration_months integer,
  year_of_study integer,
  total_course_fee numeric(14, 2),
  tuition_fee numeric(14, 2),
  currency char(3) not null default 'PGK',
  student_type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_fee_check check (
    (total_course_fee is null or total_course_fee >= 0)
    and (tuition_fee is null or tuition_fee >= 0)
  ),
  constraint student_type_check check (student_type in ('new', 'continuing'))
);

create table public.document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_document_requirements (
  id uuid primary key default gen_random_uuid(),
  grant_program_id uuid not null references public.grant_programs(id) on delete restrict,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  requirement_level text not null,
  student_type text not null default 'all',
  condition_data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grant_program_id, document_type_id, student_type),
  constraint requirement_level_check check (
    requirement_level in ('required', 'optional', 'conditional')
  ),
  constraint requirement_student_type_check check (
    student_type in ('all', 'new', 'continuing')
  )
);

create table public.application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  applicant_id uuid not null references public.applicants(id) on delete restrict,
  document_type_id uuid not null references public.document_types(id) on delete restrict,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  storage_provider text not null default 'backblaze-b2',
  storage_object_key text not null,
  status text not null default 'uploaded',
  uploaded_by uuid references public.profiles(id) on delete set null,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_size_check check (file_size_bytes > 0),
  constraint document_status_check check (
    status in ('missing', 'uploaded', 'under_review', 'verified', 'rejected', 'replacement_requested')
  )
);

create table public.eligibility_rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null,
  grant_program_id uuid not null references public.grant_programs(id) on delete restrict,
  program_year integer not null,
  community_id uuid references public.communities(id) on delete restrict,
  priority integer,
  description text not null,
  tuition_support_percentage numeric(5, 2) not null,
  geographical_applicability jsonb not null default '{}'::jsonb,
  condition_data jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grant_program_id, rule_code),
  constraint tuition_support_percentage_check check (
    tuition_support_percentage between 0 and 100
  )
);

create table public.application_eligibility_assessments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  assessed_by uuid references public.profiles(id) on delete set null,
  eligible boolean not null,
  recommended_tuition_support_percentage numeric(5, 2),
  notes text,
  assessment_data jsonb not null default '{}'::jsonb,
  assessed_at timestamptz not null default now()
);

create table public.application_applied_rules (
  assessment_id uuid not null references public.application_eligibility_assessments(id) on delete restrict,
  eligibility_rule_id uuid not null references public.eligibility_rules(id) on delete restrict,
  result text not null,
  notes text,
  primary key (assessment_id, eligibility_rule_id)
);

create table public.committees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  community_id uuid references public.communities(id) on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.committee_members (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  role_title text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (committee_id, user_id)
);

create table public.committee_meetings (
  id uuid primary key default gen_random_uuid(),
  committee_id uuid not null references public.committees(id) on delete restrict,
  meeting_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.committee_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete restrict,
  committee_id uuid references public.committees(id) on delete restrict,
  committee_meeting_id uuid references public.committee_meetings(id) on delete restrict,
  reviewer_id uuid references public.profiles(id) on delete set null,
  recommendation text not null,
  comments text,
  final_decision text,
  decision_date date,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint committee_recommendation_check check (
    recommendation in ('approve', 'not_approved', 'pending', 'other')
  )
);

create table public.applicant_restrictions (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete restrict,
  restriction_type text not null,
  reason text not null,
  source_application_id uuid references public.applications(id) on delete restrict,
  start_date date not null,
  end_date date,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funding_awards (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null unique references public.applications(id) on delete restrict,
  approved_tuition_percentage numeric(5, 2) not null,
  eligible_tuition_amount numeric(14, 2) not null,
  approved_grant_amount numeric(14, 2) not null,
  currency char(3) not null default 'PGK',
  decision_date date not null,
  approved_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint funding_amounts_check check (
    approved_tuition_percentage between 0 and 100
    and eligible_tuition_amount >= 0
    and approved_grant_amount >= 0
  )
);

create table public.payment_batches (
  id uuid primary key default gen_random_uuid(),
  batch_reference text not null unique,
  status text not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  payment_batch_id uuid references public.payment_batches(id) on delete restrict,
  funding_award_id uuid not null references public.funding_awards(id) on delete restrict,
  institution_id uuid references public.institutions(id) on delete restrict,
  applicant_id uuid not null references public.applicants(id) on delete restrict,
  amount numeric(14, 2) not null,
  currency char(3) not null default 'PGK',
  payment_reference text,
  payment_date date,
  status text not null default 'planned',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_amount_check check (amount >= 0)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index user_roles_role_id_idx on public.user_roles(role_id);
create index applicants_profile_id_idx on public.applicants(profile_id);
create index applications_applicant_id_idx on public.applications(applicant_id);
create index applications_grant_program_id_idx on public.applications(grant_program_id);
create index applications_status_id_idx on public.applications(status_id);
create index application_documents_application_id_idx on public.application_documents(application_id);
create index eligibility_rules_program_community_idx on public.eligibility_rules(grant_program_id, community_id);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs(actor_user_id);

create or replace function public.has_role(role_code text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = auth.uid()
      and r.code = role_code
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role('grants_officer')
    or public.has_role('committee_member')
    or public.has_role('administrator');
$$;

create or replace function public.next_application_number(program_year_input integer)
returns table (application_number text, sequence_number integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  allocated_sequence integer;
begin
  insert into public.application_number_counters (program_year, next_value)
  values (program_year_input, 2)
  on conflict (program_year)
  do update set next_value = public.application_number_counters.next_value + 1,
                updated_at = now()
  returning public.application_number_counters.next_value - 1 into allocated_sequence;

  return query
  select format('GMS-%s-%s', program_year_input, lpad(allocated_sequence::text, 6, '0')),
         allocated_sequence;
end;
$$;

create or replace function public.assign_application_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  program_year_value integer;
  generated record;
begin
  if new.submitted_at is not null and new.application_number is null then
    select program_year into program_year_value
    from public.grant_programs
    where id = new.grant_program_id;

    select * into generated from public.next_application_number(program_year_value);
    new.application_number = generated.application_number;
    new.sequence_number = generated.sequence_number;
  end if;

  return new;
end;
$$;

create trigger assign_application_number_before_write
before insert or update on public.applications
for each row execute function public.assign_application_number();

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger roles_updated_at before update on public.roles
for each row execute function public.set_updated_at();
create trigger communities_updated_at before update on public.communities
for each row execute function public.set_updated_at();
create trigger wards_updated_at before update on public.wards
for each row execute function public.set_updated_at();
create trigger villages_updated_at before update on public.villages
for each row execute function public.set_updated_at();
create trigger institutions_updated_at before update on public.institutions
for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses
for each row execute function public.set_updated_at();
create trigger applicants_updated_at before update on public.applicants
for each row execute function public.set_updated_at();
create trigger grant_programs_updated_at before update on public.grant_programs
for each row execute function public.set_updated_at();
create trigger application_statuses_updated_at before update on public.application_statuses
for each row execute function public.set_updated_at();
create trigger applications_updated_at before update on public.applications
for each row execute function public.set_updated_at();
create trigger education_history_updated_at before update on public.education_history
for each row execute function public.set_updated_at();
create trigger application_study_details_updated_at before update on public.application_study_details
for each row execute function public.set_updated_at();
create trigger document_types_updated_at before update on public.document_types
for each row execute function public.set_updated_at();
create trigger program_document_requirements_updated_at before update on public.program_document_requirements
for each row execute function public.set_updated_at();
create trigger application_documents_updated_at before update on public.application_documents
for each row execute function public.set_updated_at();
create trigger eligibility_rules_updated_at before update on public.eligibility_rules
for each row execute function public.set_updated_at();
create trigger committees_updated_at before update on public.committees
for each row execute function public.set_updated_at();
create trigger committee_members_updated_at before update on public.committee_members
for each row execute function public.set_updated_at();
create trigger committee_meetings_updated_at before update on public.committee_meetings
for each row execute function public.set_updated_at();
create trigger committee_reviews_updated_at before update on public.committee_reviews
for each row execute function public.set_updated_at();
create trigger applicant_restrictions_updated_at before update on public.applicant_restrictions
for each row execute function public.set_updated_at();
create trigger funding_awards_updated_at before update on public.funding_awards
for each row execute function public.set_updated_at();
create trigger payment_batches_updated_at before update on public.payment_batches
for each row execute function public.set_updated_at();
create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.applicants enable row level security;
alter table public.grant_programs enable row level security;
alter table public.applications enable row level security;
alter table public.application_status_history enable row level security;
alter table public.application_documents enable row level security;
alter table public.application_eligibility_assessments enable row level security;
alter table public.application_applied_rules enable row level security;
alter table public.committee_reviews enable row level security;
alter table public.applicant_restrictions enable row level security;
alter table public.funding_awards enable row level security;
alter table public.payments enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can read their own profile"
on public.profiles for select using (id = auth.uid() or public.is_staff());

create policy "Users can update their own profile"
on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "Administrators manage roles"
on public.roles for all using (public.has_role('administrator')) with check (public.has_role('administrator'));

create policy "Users can read own roles"
on public.user_roles for select using (user_id = auth.uid() or public.is_staff());

create policy "Administrators manage user roles"
on public.user_roles for all using (public.has_role('administrator')) with check (public.has_role('administrator'));

create policy "Applicants read own applicant record"
on public.applicants for select using (profile_id = auth.uid() or public.is_staff());

create policy "Applicants create own applicant record"
on public.applicants for insert with check (profile_id = auth.uid());

create policy "Applicants update own applicant record before staff review"
on public.applicants for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "Programs are readable to authenticated users"
on public.grant_programs for select using (auth.uid() is not null);

create policy "Administrators manage programs"
on public.grant_programs for all using (public.has_role('administrator')) with check (public.has_role('administrator'));

create policy "Applicants read own applications"
on public.applications for select using (
  public.is_staff()
  or exists (
    select 1 from public.applicants a
    where a.id = applications.applicant_id and a.profile_id = auth.uid()
  )
);

create policy "Applicants create own applications"
on public.applications for insert with check (
  exists (
    select 1 from public.applicants a
    where a.id = applications.applicant_id and a.profile_id = auth.uid()
  )
);

create policy "Staff manage applications"
on public.applications for update using (public.is_staff()) with check (public.is_staff());

create policy "Status history readable by participants"
on public.application_status_history for select using (
  public.is_staff()
  or exists (
    select 1
    from public.applications app
    join public.applicants a on a.id = app.applicant_id
    where app.id = application_status_history.application_id and a.profile_id = auth.uid()
  )
);

create policy "Staff writes status history"
on public.application_status_history for insert with check (public.is_staff());

create policy "Documents readable by owner or staff"
on public.application_documents for select using (
  public.is_staff()
  or exists (
    select 1 from public.applicants a
    where a.id = application_documents.applicant_id and a.profile_id = auth.uid()
  )
);

create policy "Applicants upload own documents"
on public.application_documents for insert with check (
  exists (
    select 1 from public.applicants a
    where a.id = application_documents.applicant_id and a.profile_id = auth.uid()
  )
);

create policy "Staff review documents"
on public.application_documents for update using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage eligibility assessments"
on public.application_eligibility_assessments for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage applied rules"
on public.application_applied_rules for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage committee reviews"
on public.committee_reviews for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage applicant restrictions"
on public.applicant_restrictions for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage funding awards"
on public.funding_awards for all using (public.is_staff()) with check (public.is_staff());

create policy "Staff manage payments"
on public.payments for all using (public.is_staff()) with check (public.is_staff());

create policy "Audit logs visible to administrators"
on public.audit_logs for select using (public.has_role('administrator'));

create policy "Authenticated inserts audit logs"
on public.audit_logs for insert with check (auth.uid() is not null);
