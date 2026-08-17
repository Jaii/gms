import { z } from 'zod'

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .nullable()

export const applicantProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  middleName: optionalText,
  surname: z.string().trim().min(1, 'Surname is required.'),
  dateOfBirth: optionalText,
  sex: optionalText,
  clan: optionalText,
  communityId: optionalText,
  residentialAddress: optionalText,
  postalAddress: optionalText,
  telephone: optionalText,
  mobilePhone: optionalText,
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .or(z.literal(''))
    .transform((value) => (value.length > 0 ? value : null)),
})

export type ApplicantProfileFormData = z.infer<typeof applicantProfileSchema>

export type ApplicantProfileFormInput = z.input<typeof applicantProfileSchema>

export const emptyApplicantProfileForm: ApplicantProfileFormInput = {
  firstName: '',
  middleName: '',
  surname: '',
  dateOfBirth: '',
  sex: '',
  clan: '',
  communityId: '',
  residentialAddress: '',
  postalAddress: '',
  telephone: '',
  mobilePhone: '',
  email: '',
}
