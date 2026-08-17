create or replace function public.submit_application(
  application_id_input uuid,
  declaration_text_input text
)
returns public.applications
language plpgsql
security definer
set search_path = public
as $$
declare
  application_record public.applications;
  draft_status_id uuid;
  submitted_status_id uuid;
  missing_required_documents integer;
begin
  if nullif(trim(declaration_text_input), '') is null then
    raise exception 'Declaration is required before submission.';
  end if;

  select * into application_record
  from public.applications
  where id = application_id_input
  for update;

  if not found then
    raise exception 'Application not found.';
  end if;

  if not exists (
    select 1
    from public.applicants a
    where a.id = application_record.applicant_id
      and a.profile_id = auth.uid()
  ) then
    raise exception 'You are not allowed to submit this application.';
  end if;

  select id into draft_status_id
  from public.application_statuses
  where code = 'draft';

  select id into submitted_status_id
  from public.application_statuses
  where code = 'submitted';

  if application_record.status_id <> draft_status_id then
    raise exception 'Only draft applications can be submitted.';
  end if;

  if not exists (
    select 1
    from public.application_study_details sd
    where sd.application_id = application_record.id
      and nullif(trim(coalesce(sd.institution_name, '')), '') is not null
      and nullif(trim(coalesce(sd.proposed_course, '')), '') is not null
      and sd.tuition_fee is not null
  ) then
    raise exception 'Complete current study details before submission.';
  end if;

  select count(*) into missing_required_documents
  from public.program_document_requirements pdr
  where pdr.grant_program_id = application_record.grant_program_id
    and pdr.active = true
    and pdr.requirement_level = 'required'
    and not exists (
      select 1
      from public.application_documents ad
      where ad.application_id = application_record.id
        and ad.document_type_id = pdr.document_type_id
        and ad.status in ('uploaded', 'under_review', 'verified')
    );

  if missing_required_documents > 0 then
    raise exception 'Upload all required documents before submission.';
  end if;

  update public.applications
  set status_id = submitted_status_id,
      submitted_at = now()
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
    draft_status_id,
    submitted_status_id,
    auth.uid(),
    declaration_text_input
  );

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    new_values
  )
  values (
    auth.uid(),
    'application_submitted',
    'applications',
    application_record.id,
    jsonb_build_object(
      'application_number', application_record.application_number,
      'submitted_at', application_record.submitted_at
    )
  );

  return application_record;
end;
$$;
