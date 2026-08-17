create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  applicant_role_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name);

  select id into applicant_role_id
  from public.roles
  where code = 'applicant';

  if applicant_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, applicant_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_user_role_codes()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(r.code order by r.code), array[]::text[])
  from public.user_roles ur
  join public.roles r on r.id = ur.role_id
  where ur.user_id = auth.uid();
$$;

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
with check (id = auth.uid());

drop policy if exists "Authenticated users read active communities" on public.communities;
alter table public.communities enable row level security;
create policy "Authenticated users read active communities"
on public.communities for select
using (auth.uid() is not null and active = true);

drop policy if exists "Authenticated users read active villages" on public.villages;
alter table public.villages enable row level security;
create policy "Authenticated users read active villages"
on public.villages for select
using (auth.uid() is not null and active = true);

drop policy if exists "Authenticated users read wards" on public.wards;
alter table public.wards enable row level security;
create policy "Authenticated users read wards"
on public.wards for select
using (auth.uid() is not null);

drop policy if exists "Authenticated users read application statuses" on public.application_statuses;
alter table public.application_statuses enable row level security;
create policy "Authenticated users read application statuses"
on public.application_statuses for select
using (auth.uid() is not null);

drop policy if exists "Authenticated users read document types" on public.document_types;
alter table public.document_types enable row level security;
create policy "Authenticated users read document types"
on public.document_types for select
using (auth.uid() is not null and active = true);

drop policy if exists "Authenticated users read program document requirements" on public.program_document_requirements;
alter table public.program_document_requirements enable row level security;
create policy "Authenticated users read program document requirements"
on public.program_document_requirements for select
using (auth.uid() is not null and active = true);

drop policy if exists "Authenticated users read eligibility rules" on public.eligibility_rules;
alter table public.eligibility_rules enable row level security;
create policy "Authenticated users read eligibility rules"
on public.eligibility_rules for select
using (auth.uid() is not null and active = true);
