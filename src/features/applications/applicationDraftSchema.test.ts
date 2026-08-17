import { describe, expect, it } from 'vitest'
import {
  applicationDraftSchema,
  createEmptyEducationRecord,
} from './applicationDraftSchema'

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
})
