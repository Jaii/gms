import { describe, expect, it } from 'vitest'
import {
  applicationDraftSchema,
  createEmptyEducationRecord,
} from './applicationDraftSchema'
import {
  draftContextToForm,
  type DraftApplicationContext,
} from './applicationDraftService'

describe('applicationDraftSchema', () => {
  it('requires current study institution and course', () => {
    const result = applicationDraftSchema.safeParse({
      educationHistory: [],
      currentStudy: {
        institutionName: '',
        proposedCourse: '',
        durationMonths: '',
        yearOfStudy: '',
        totalCourseFee: '',
        tuitionFee: '',
        currency: 'PGK',
        studentType: 'new',
      },
      additionalInformation: '',
    })

    expect(result.success).toBe(false)
  })

  it('normalizes blank optional values', () => {
    const result = applicationDraftSchema.parse({
      educationHistory: [createEmptyEducationRecord()],
      currentStudy: {
        institutionName: 'University of Papua New Guinea',
        proposedCourse: 'Bachelor of Law',
        durationMonths: '',
        yearOfStudy: '',
        totalCourseFee: '',
        tuitionFee: '12000.00',
        currency: 'PGK',
        studentType: 'continuing',
      },
      additionalInformation: '',
    })

    expect(result.currentStudy.durationMonths).toBeNull()
    expect(result.currentStudy.tuitionFee).toBe('12000.00')
    expect(result.additionalInformation).toBeNull()
  })

  it('converts persisted numeric study amounts back to string inputs', () => {
    const form = draftContextToForm({
      applicant: null,
      application: null,
      draftStatus: {
        id: 'status-id',
        code: 'draft',
        name: 'Draft',
        sort_order: 10,
        is_terminal: false,
        created_at: '',
        updated_at: '',
      },
      educationHistory: [],
      grantProgram: {
        id: 'program-id',
        code: 'TTFSP',
        name: 'Tertiary Tuition Fees Support Project',
        description: null,
        program_year: 2026,
        opening_date: null,
        closing_date: null,
        status: 'draft',
        base_currency: 'PGK',
        created_at: '',
        updated_at: '',
      },
      studyDetails: {
        id: 'study-id',
        application_id: 'application-id',
        institution_id: null,
        institution_name: 'University of Papua New Guinea',
        course_id: null,
        proposed_course: 'Accounting',
        duration_months: 36,
        year_of_study: 1,
        total_course_fee: 15000 as unknown as string,
        tuition_fee: 12000 as unknown as string,
        currency: 'PGK',
        student_type: 'new',
        created_at: '',
        updated_at: '',
      },
    } satisfies DraftApplicationContext)

    expect(form.currentStudy.totalCourseFee).toBe('15000')
    expect(form.currentStudy.tuitionFee).toBe('12000')
    expect(form.currentStudy.durationMonths).toBe('36')
  })
})
