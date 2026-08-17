alter table public.application_study_details
add column if not exists institution_name text;

alter table public.education_history enable row level security;
alter table public.application_study_details enable row level security;
alter table public.institutions enable row level security;
alter table public.courses enable row level security;

drop policy if exists "Applicants update own draft applications" on public.applications;
create policy "Applicants update own draft applications"
on public.applications for update
using (
  exists (
    select 1
    from public.applicants a
    join public.application_statuses s on s.id = applications.status_id
    where a.id = applications.applicant_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.applicants a
    join public.application_statuses s on s.id = applications.status_id
    where a.id = applications.applicant_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
);

drop policy if exists "Applicants read own education history" on public.education_history;
create policy "Applicants read own education history"
on public.education_history for select
using (
  public.is_staff()
  or exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
);

drop policy if exists "Applicants insert own education history" on public.education_history;
create policy "Applicants insert own education history"
on public.education_history for insert
with check (
  exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
);

drop policy if exists "Applicants update own education history" on public.education_history;
create policy "Applicants update own education history"
on public.education_history for update
using (
  exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
);

drop policy if exists "Applicants delete own education history" on public.education_history;
create policy "Applicants delete own education history"
on public.education_history for delete
using (
  exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
);

drop policy if exists "Application study details readable by owner or staff" on public.application_study_details;
create policy "Application study details readable by owner or staff"
on public.application_study_details for select
using (
  public.is_staff()
  or exists (
    select 1
    from public.applications app
    join public.applicants a on a.id = app.applicant_id
    where app.id = application_study_details.application_id
      and a.profile_id = auth.uid()
  )
);

drop policy if exists "Applicants insert own draft study details" on public.application_study_details;
create policy "Applicants insert own draft study details"
on public.application_study_details for insert
with check (
  exists (
    select 1
    from public.applications app
    join public.applicants a on a.id = app.applicant_id
    join public.application_statuses s on s.id = app.status_id
    where app.id = application_study_details.application_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
);

drop policy if exists "Applicants update own draft study details" on public.application_study_details;
create policy "Applicants update own draft study details"
on public.application_study_details for update
using (
  exists (
    select 1
    from public.applications app
    join public.applicants a on a.id = app.applicant_id
    join public.application_statuses s on s.id = app.status_id
    where app.id = application_study_details.application_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
)
with check (
  exists (
    select 1
    from public.applications app
    join public.applicants a on a.id = app.applicant_id
    join public.application_statuses s on s.id = app.status_id
    where app.id = application_study_details.application_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
);

drop policy if exists "Authenticated users read active institutions" on public.institutions;
create policy "Authenticated users read active institutions"
on public.institutions for select
using (auth.uid() is not null and active = true);

drop policy if exists "Authenticated users read active courses" on public.courses;
create policy "Authenticated users read active courses"
on public.courses for select
using (auth.uid() is not null and active = true);
