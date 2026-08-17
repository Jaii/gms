import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()

const optionalInteger = z
  .string()
  .trim()
  .transform((value) => {
    if (value.length === 0) {
      return null
    }

    const parsed = Number.parseInt(value, 10)
    return Number.isNaN(parsed) ? Number.NaN : parsed
  })
  .refine((value) => value === null || Number.isInteger(value), {
    message: 'Enter a whole number.',
  })

const optionalMoney = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || !Number.isNaN(Number.parseFloat(value)), {
    message: 'Enter a valid amount.',
  })
  .transform((value) => {
    if (value.length === 0) {
      return null
    }

    return value
  })

export const educationRecordSchema = z.object({
  localId: z.string(),
  educationLevel: z.enum(['secondary', 'tertiary', 'other']),
  gradeLevel: optionalText,
  schoolName: optionalText,
  course: optionalText,
  yearGraduated: optionalInteger,
  award: optionalText,
})

export const applicationDraftSchema = z.object({
  educationHistory: z.array(educationRecordSchema),
  currentStudy: z.object({
    institutionName: z.string().trim().min(1, 'Institution is required.'),
    proposedCourse: z.string().trim().min(1, 'Proposed course is required.'),
    durationMonths: optionalInteger,
    yearOfStudy: optionalInteger,
    totalCourseFee: optionalMoney,
    tuitionFee: optionalMoney,
    currency: z.string().trim().length(3, 'Currency must use a 3-letter code.'),
    studentType: z.enum(['new', 'continuing']),
  }),
  additionalInformation: optionalText,
})

export type ApplicationDraftFormData = z.infer<typeof applicationDraftSchema>
export type ApplicationDraftFormInput = z.input<typeof applicationDraftSchema>
export type EducationRecordInput = ApplicationDraftFormInput['educationHistory'][number]

export const emptyApplicationDraftForm: ApplicationDraftFormInput = {
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
}

export function createEmptyEducationRecord(
  educationLevel: EducationRecordInput['educationLevel'] = 'secondary',
): EducationRecordInput {
  return {
    localId: crypto.randomUUID(),
    educationLevel,
    gradeLevel: '',
    schoolName: '',
    course: '',
    yearGraduated: '',
    award: '',
  }
}
