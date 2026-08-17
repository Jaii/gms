create or replace function public.bootstrap_first_administrator()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  administrator_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to create the first administrator.';
  end if;

  select id into administrator_role_id
  from public.roles
  where code = 'administrator';

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
