create index if not exists applications_status_submitted_at_idx
on public.applications(status_id, submitted_at, updated_at);

create index if not exists applicants_name_search_idx
on public.applicants(surname, first_name);

create or replace function public.staff_review_dashboard_counts()
returns table (
  status_code text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Only staff can view review dashboard counts.';
  end if;

  return query
  select
    s.code as status_code,
    count(app.id)::bigint as total_count
  from public.application_statuses s
  left join public.applications app on app.status_id = s.id
  where s.code in (
    'submitted',
    'initial_review',
    'information_required',
    'document_verification',
    'eligibility_review',
    'ready_for_committee'
  )
  group by s.code, s.sort_order
  order by s.sort_order;
end;
$$;

create or replace function public.staff_review_queue(
  limit_input integer default 25,
  offset_input integer default 0,
  status_code_input text default null,
  search_input text default null
)
returns table (
  application_id uuid,
  application_number text,
  submitted_at timestamptz,
  updated_at timestamptz,
  applicant_id uuid,
  applicant_first_name text,
  applicant_surname text,
  status_code text,
  status_name text,
  proposed_course text,
  document_count bigint,
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
  if not public.is_staff() then
    raise exception 'Only staff can view the review queue.';
  end if;

  if status_code_input is not null
     and status_code_input not in (
       'submitted',
       'initial_review',
       'information_required',
       'document_verification',
       'eligibility_review',
       'ready_for_committee'
     ) then
    raise exception 'Unsupported review queue status.';
  end if;

  return query
  with filtered_applications as (
    select
      app.id as application_id,
      app.application_number,
      app.submitted_at,
      app.updated_at,
      a.id as applicant_id,
      a.first_name as applicant_first_name,
      a.surname as applicant_surname,
      s.code as status_code,
      s.name as status_name,
      sd.proposed_course,
      count(*) over()::bigint as total_count
    from public.applications app
    join public.application_statuses s on s.id = app.status_id
    join public.applicants a on a.id = app.applicant_id
    left join public.application_study_details sd on sd.application_id = app.id
    where s.code in (
      'submitted',
      'initial_review',
      'information_required',
      'document_verification',
      'eligibility_review',
      'ready_for_committee'
    )
      and (status_code_input is null or s.code = status_code_input)
      and (
        search_value is null
        or app.application_number ilike '%' || search_value || '%'
        or a.first_name ilike '%' || search_value || '%'
        or a.surname ilike '%' || search_value || '%'
        or concat_ws(' ', a.first_name, a.surname) ilike '%' || search_value || '%'
      )
    order by coalesce(app.submitted_at, app.updated_at) asc, app.created_at asc
    limit limit_value
    offset offset_value
  )
  select
    filtered_applications.application_id,
    filtered_applications.application_number,
    filtered_applications.submitted_at,
    filtered_applications.updated_at,
    filtered_applications.applicant_id,
    filtered_applications.applicant_first_name,
    filtered_applications.applicant_surname,
    filtered_applications.status_code,
    filtered_applications.status_name,
    filtered_applications.proposed_course,
    (
      select count(*)::bigint
      from public.application_documents ad
      where ad.application_id = filtered_applications.application_id
    ) as document_count,
    filtered_applications.total_count
  from filtered_applications;
end;
$$;
