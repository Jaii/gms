create or replace function public.admin_user_directory(
  search_input text default null,
  limit_input integer default 25,
  offset_input integer default 0
)
returns table (
  profile_id uuid,
  email text,
  full_name text,
  role_codes text[],
  created_at timestamptz,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  limit_value integer := least(greatest(coalesce(limit_input, 25), 1), 100);
  offset_value integer := greatest(coalesce(offset_input, 0), 0);
  search_value text := nullif(trim(coalesce(search_input, '')), '');
begin
  if not public.has_role('administrator') then
    raise exception 'Only administrators can manage users.';
  end if;

  return query
  with profile_roles as (
    select
      p.id as profile_id,
      p.email,
      p.full_name,
      coalesce(
        array_agg(r.code order by r.code) filter (where r.code is not null),
        array[]::text[]
      ) as role_codes,
      p.created_at
    from public.profiles p
    left join public.user_roles ur on ur.user_id = p.id
    left join public.roles r on r.id = ur.role_id
    where search_value is null
       or p.email ilike '%' || search_value || '%'
       or p.full_name ilike '%' || search_value || '%'
    group by p.id, p.email, p.full_name, p.created_at
  ),
  counted_profiles as (
    select
      profile_roles.*,
      count(*) over()::bigint as total_count
    from profile_roles
    order by profile_roles.created_at desc
    limit limit_value
    offset offset_value
  )
  select
    counted_profiles.profile_id,
    counted_profiles.email,
    counted_profiles.full_name,
    counted_profiles.role_codes,
    counted_profiles.created_at,
    counted_profiles.total_count
  from counted_profiles;
end;
$$;

create or replace function public.admin_update_user_roles(
  user_id_input uuid,
  role_codes_input text[]
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_role_codes text[] := array[
    'applicant',
    'grants_officer',
    'committee_member',
    'administrator'
  ];
  staff_role_codes text[] := array[
    'grants_officer',
    'committee_member',
    'administrator'
  ];
  normalized_role_codes text[];
  invalid_role_codes text[];
  administrator_role_id uuid;
  current_administrator_count integer;
begin
  if not public.has_role('administrator') then
    raise exception 'Only administrators can update user roles.';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = user_id_input
  ) then
    raise exception 'User profile not found.';
  end if;

  select coalesce(array_agg(distinct trim(role_code)), array[]::text[])
  into normalized_role_codes
  from unnest(coalesce(role_codes_input, array[]::text[])) as role_code
  where nullif(trim(role_code), '') is not null;

  select coalesce(array_agg(role_code), array[]::text[])
  into invalid_role_codes
  from unnest(normalized_role_codes) as role_code
  where role_code <> all(allowed_role_codes);

  if coalesce(array_length(invalid_role_codes, 1), 0) > 0 then
    raise exception 'Unsupported role code: %', array_to_string(invalid_role_codes, ', ');
  end if;

  if coalesce(array_length(normalized_role_codes, 1), 0) = 0 then
    raise exception 'Select at least one role.';
  end if;

  if normalized_role_codes && staff_role_codes then
    select coalesce(array_agg(role_code), array[]::text[])
    into normalized_role_codes
    from unnest(normalized_role_codes) as role_code
    where role_code <> 'applicant';
  end if;

  if user_id_input = auth.uid()
     and not ('administrator' = any(normalized_role_codes)) then
    raise exception 'You cannot remove your own administrator role.';
  end if;

  select id into administrator_role_id
  from public.roles
  where code = 'administrator';

  if administrator_role_id is null then
    raise exception 'Administrator role is not configured.';
  end if;

  if not ('administrator' = any(normalized_role_codes))
     and exists (
       select 1
       from public.user_roles ur
       where ur.user_id = user_id_input
         and ur.role_id = administrator_role_id
     ) then
    select count(*) into current_administrator_count
    from public.user_roles ur
    where ur.role_id = administrator_role_id;

    if current_administrator_count <= 1 then
      raise exception 'At least one administrator account is required.';
    end if;
  end if;

  delete from public.user_roles
  where user_id = user_id_input;

  insert into public.user_roles (user_id, role_id, assigned_by)
  select user_id_input, r.id, auth.uid()
  from public.roles r
  where r.code = any(normalized_role_codes)
  on conflict (user_id, role_id) do nothing;

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    'user_roles_updated',
    'user_roles',
    user_id_input,
    jsonb_build_object('role_codes', normalized_role_codes)
  );

  return (
    select coalesce(array_agg(r.code order by r.code), array[]::text[])
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.user_id = user_id_input
  );
end;
$$;
