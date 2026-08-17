import { describe, expect, it } from 'vitest'
import { applicantProfileSchema } from './applicantProfileSchema'

describe('applicantProfileSchema', () => {
  it('requires first name and surname', () => {
    const result = applicantProfileSchema.safeParse({
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
    })

    expect(result.success).toBe(false)
  })

  it('normalizes blank optional fields to null', () => {
    const result = applicantProfileSchema.parse({
      firstName: 'Jason',
      middleName: '',
      surname: 'Gaitu',
      dateOfBirth: '',
      sex: '',
      clan: '',
      communityId: '',
      residentialAddress: '',
      postalAddress: '',
      telephone: '',
      mobilePhone: '',
      email: '',
    })

    expect(result.middleName).toBeNull()
    expect(result.email).toBeNull()
  })
})
