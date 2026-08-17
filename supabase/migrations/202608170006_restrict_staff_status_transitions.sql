create or replace function public.staff_update_application_status(
  application_id_input uuid,
  new_status_code_input text,
  reason_input text
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  application_record public.applications;
  previous_status_id uuid;
  new_status_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Only staff can update application status.';
  end if;

  if nullif(trim(reason_input), '') is null then
    raise exception 'A status change reason is required.';
  end if;

  if new_status_code_input not in (
    'initial_review',
    'information_required',
    'document_verification',
    'eligibility_review',
    'ready_for_committee'
  ) then
    raise exception 'Status is not available in the staff review workflow.';
  end if;

  select * into application_record
  from public.applications
  where id = application_id_input
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  select id into new_status_id
  from public.application_statuses
  where code = new_status_code_input;

  if new_status_id is null then
    raise exception 'Unknown application status.';
  end if;

  previous_status_id := application_record.status_id;

  update public.applications
  set status_id = new_status_id
  where id = application_record.id
  returning * into application_record;

  insert into public.application_status_history (
    application_id,
    previous_status_id,
    new_status_id,
    changed_by,
    reason
  )
  values (
    application_record.id,
    previous_status_id,
    new_status_id,
    auth.uid(),
    reason_input
  );

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  values (
    auth.uid(),
    'application_status_changed',
    'applications',
    application_record.id,
    jsonb_build_object('status_id', previous_status_id),
    jsonb_build_object('status_id', new_status_id, 'reason', reason_input)
  );

  return application_record;
end;
$$;
