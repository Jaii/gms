create or replace function public.bootstrap_first_administrator()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  administrator_role_id uuid;
  applicant_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create the first administrator.';
  end if;

  select id into administrator_role_id
  from public.roles
  where code = 'administrator';

  select id into applicant_role_id
  from public.roles
  where code = 'applicant';

  if administrator_role_id is null then
    raise exception 'Administrator role is not configured.';
  end if;

  if exists (
    select 1
    from public.user_roles ur
    where ur.role_id = administrator_role_id
  ) then
    if exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role_id = administrator_role_id
    ) then
      delete from public.user_roles
      where user_id = auth.uid()
        and role_id = applicant_role_id;

      return public.current_user_role_codes();
    end if;

    raise exception 'Administrator account already exists.';
  end if;

  insert into public.profiles (id, email, full_name)
  values (
    auth.uid(),
    auth.jwt() ->> 'email',
    nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = coalesce(public.profiles.email, excluded.email),
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  insert into public.user_roles (user_id, role_id)
  values (auth.uid(), administrator_role_id)
  on conflict (user_id, role_id) do nothing;

  delete from public.user_roles
  where user_id = auth.uid()
    and role_id = applicant_role_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    'first_administrator_bootstrapped',
    'user_roles',
    auth.uid(),
    jsonb_build_object('role_code', 'administrator')
  );

  return public.current_user_role_codes();
end;
$$;

delete from public.user_roles applicant_assignment
using public.roles applicant_role
where applicant_assignment.role_id = applicant_role.id
  and applicant_role.code = 'applicant'
  and exists (
    select 1
    from public.user_roles administrator_assignment
    join public.roles administrator_role
      on administrator_role.id = administrator_assignment.role_id
    where administrator_assignment.user_id = applicant_assignment.user_id
      and administrator_role.code = 'administrator'
  );

drop policy if exists "Applicants create own applicant record" on public.applicants;
create policy "Applicants create own applicant record"
on public.applicants for insert
with check (profile_id = auth.uid() and not public.is_staff());

drop policy if exists "Applicants update own applicant record before staff review" on public.applicants;
create policy "Applicants update own applicant record before staff review"
on public.applicants for update
using (profile_id = auth.uid() and not public.is_staff())
with check (profile_id = auth.uid() and not public.is_staff());

drop policy if exists "Applicants create own applications" on public.applications;
create policy "Applicants create own applications"
on public.applications for insert
with check (
  not public.is_staff()
  and exists (
    select 1 from public.applicants a
    where a.id = applications.applicant_id and a.profile_id = auth.uid()
  )
);

drop policy if exists "Applicants update own draft applications" on public.applications;
create policy "Applicants update own draft applications"
on public.applications for update
using (
  not public.is_staff()
  and exists (
    select 1
    from public.applicants a
    join public.application_statuses s on s.id = applications.status_id
    where a.id = applications.applicant_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
)
with check (
  not public.is_staff()
  and exists (
    select 1
    from public.applicants a
    join public.application_statuses s on s.id = applications.status_id
    where a.id = applications.applicant_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
);

drop policy if exists "Applicants insert own education history" on public.education_history;
create policy "Applicants insert own education history"
on public.education_history for insert
with check (
  not public.is_staff()
  and exists (
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
  not public.is_staff()
  and exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
)
with check (
  not public.is_staff()
  and exists (
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
  not public.is_staff()
  and exists (
    select 1
    from public.applicants a
    where a.id = education_history.applicant_id
      and a.profile_id = auth.uid()
  )
);

drop policy if exists "Applicants insert own draft study details" on public.application_study_details;
create policy "Applicants insert own draft study details"
on public.application_study_details for insert
with check (
  not public.is_staff()
  and exists (
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
  not public.is_staff()
  and exists (
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
  not public.is_staff()
  and exists (
    select 1
    from public.applications app
    join public.applicants a on a.id = app.applicant_id
    join public.application_statuses s on s.id = app.status_id
    where app.id = application_study_details.application_id
      and a.profile_id = auth.uid()
      and s.code = 'draft'
  )
);

drop policy if exists "Applicants upload own documents" on public.application_documents;
create policy "Applicants upload own documents"
on public.application_documents for insert
with check (
  not public.is_staff()
  and exists (
    select 1 from public.applicants a
    where a.id = application_documents.applicant_id and a.profile_id = auth.uid()
  )
);
