import type { GmsSupabaseClient } from '../../lib/supabaseClient'
import type { Database } from '../../types/database'
import type {
  ApplicationDraftFormData,
  ApplicationDraftFormInput,
} from './applicationDraftSchema'
import { emptyApplicationDraftForm } from './applicationDraftSchema'

type ApplicantRow = Database['public']['Tables']['applicants']['Row']
type ApplicationRow = Database['public']['Tables']['applications']['Row']
type ApplicationStatusRow = Database['public']['Tables']['application_statuses']['Row']
type ApplicationStudyRow =
  Database['public']['Tables']['application_study_details']['Row']
type EducationRow = Database['public']['Tables']['education_history']['Row']
type GrantProgramRow = Database['public']['Tables']['grant_programs']['Row']

export type DraftApplicationContext = {
  applicant: ApplicantRow | null
  application: ApplicationRow | null
  draftStatus: ApplicationStatusRow
  educationHistory: EducationRow[]
  grantProgram: GrantProgramRow
  studyDetails: ApplicationStudyRow | null
}

export type SavedDraftApplication = {
  application: ApplicationRow
  studyDetails: ApplicationStudyRow | null
}

function valueToInput(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function numberToInput(value: number | string | null | undefined): string {
  return valueToInput(value)
}

export function draftContextToForm(
  context: DraftApplicationContext,
): ApplicationDraftFormInput {
  return {
    ...emptyApplicationDraftForm,
    educationHistory: context.educationHistory.map((record) => ({
      localId: record.id,
      educationLevel: record.education_level,
      gradeLevel: record.grade_level ?? '',
      schoolName: record.school_name ?? '',
      course: record.course ?? '',
      yearGraduated: numberToInput(record.year_graduated),
      award: record.award ?? '',
    })),
    currentStudy: {
      institutionName: context.studyDetails?.institution_name ?? '',
      proposedCourse: context.studyDetails?.proposed_course ?? '',
      durationMonths: numberToInput(context.studyDetails?.duration_months ?? null),
      yearOfStudy: numberToInput(context.studyDetails?.year_of_study ?? null),
      totalCourseFee: valueToInput(context.studyDetails?.total_course_fee),
      tuitionFee: valueToInput(context.studyDetails?.tuition_fee),
      currency:
        context.studyDetails?.currency ?? context.grantProgram.base_currency ?? 'PGK',
      studentType: context.studyDetails?.student_type ?? 'new',
    },
    additionalInformation: context.application?.additional_information ?? '',
  }
}

export async function fetchDraftApplicationContext(
  client: GmsSupabaseClient,
  userId: string,
): Promise<DraftApplicationContext> {
  const { data: applicant, error: applicantError } = await client
    .from('applicants')
    .select('*')
    .eq('profile_id', userId)
    .maybeSingle()

  if (applicantError) {
    throw applicantError
  }

  const { data: grantProgram, error: grantProgramError } = await client
    .from('grant_programs')
    .select('*')
    .eq('code', 'TTFSP')
    .eq('program_year', 2026)
    .single()

  if (grantProgramError) {
    throw grantProgramError
  }

  const { data: draftStatus, error: statusError } = await client
    .from('application_statuses')
    .select('*')
    .eq('code', 'draft')
    .single()

  if (statusError) {
    throw statusError
  }

  if (!applicant) {
    return {
      applicant,
      application: null,
      draftStatus,
      educationHistory: [],
      grantProgram,
      studyDetails: null,
    }
  }

  const [
    { data: application, error: applicationError },
    { data: educationHistory, error: educationError },
  ] = await Promise.all([
    client
      .from('applications')
      .select('*')
      .eq('applicant_id', applicant.id)
      .eq('grant_program_id', grantProgram.id)
      .maybeSingle(),
    client
      .from('education_history')
      .select('*')
      .eq('applicant_id', applicant.id)
      .order('created_at', { ascending: true }),
  ])

  if (applicationError) {
    throw applicationError
  }

  if (educationError) {
    throw educationError
  }

  const { data: studyDetails, error: studyError } = application
    ? await client
        .from('application_study_details')
        .select('*')
        .eq('application_id', application.id)
        .maybeSingle()
    : { data: null, error: null }

  if (studyError) {
    throw studyError
  }

  return {
    applicant,
    application,
    draftStatus,
    educationHistory: educationHistory ?? [],
    grantProgram,
    studyDetails,
  }
}

export async function saveDraftApplication(
  client: GmsSupabaseClient,
  userId: string,
  context: DraftApplicationContext,
  values: ApplicationDraftFormData,
): Promise<SavedDraftApplication> {
  if (!context.applicant) {
    throw new Error('Create your applicant profile before starting an application.')
  }

  const applicationPayload: Database['public']['Tables']['applications']['Insert'] = {
    applicant_id: context.applicant.id,
    grant_program_id: context.grantProgram.id,
    status_id: context.draftStatus.id,
    additional_information: values.additionalInformation,
    created_by: userId,
  }

  const { data: application, error: applicationError } = await client
    .from('applications')
    .upsert(applicationPayload, {
      onConflict: 'applicant_id,grant_program_id',
    })
    .select()
    .single()

  if (applicationError) {
    throw applicationError
  }

  const studyPayload: Database['public']['Tables']['application_study_details']['Insert'] =
    {
      application_id: application.id,
      institution_name: values.currentStudy.institutionName,
      proposed_course: values.currentStudy.proposedCourse,
      duration_months: values.currentStudy.durationMonths,
      year_of_study: values.currentStudy.yearOfStudy,
      total_course_fee: values.currentStudy.totalCourseFee,
      tuition_fee: values.currentStudy.tuitionFee,
      currency: values.currentStudy.currency,
      student_type: values.currentStudy.studentType,
    }

  const { data: studyDetails, error: studyError } = await client
    .from('application_study_details')
    .upsert(studyPayload, { onConflict: 'application_id' })
    .select()
    .single()

  if (studyError) {
    throw studyError
  }

  const { error: deleteEducationError } = await client
    .from('education_history')
    .delete()
    .eq('applicant_id', context.applicant.id)

  if (deleteEducationError) {
    throw deleteEducationError
  }

  const educationPayload = values.educationHistory
    .filter((record) =>
      [
        record.gradeLevel,
        record.schoolName,
        record.course,
        record.yearGraduated,
        record.award,
      ].some((value) => value !== null && value !== ''),
    )
    .map((record) => ({
      applicant_id: context.applicant!.id,
      education_level: record.educationLevel,
      grade_level: record.gradeLevel,
      school_name: record.schoolName,
      course: record.course,
      year_graduated: record.yearGraduated,
      award: record.award,
    }))

  if (educationPayload.length > 0) {
    const { error: educationInsertError } = await client
      .from('education_history')
      .insert(educationPayload)

    if (educationInsertError) {
      throw educationInsertError
    }
  }

  return { application, studyDetails }
}
