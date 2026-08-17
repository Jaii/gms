import { useEffect, useMemo, useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import {
  applicantProfileSchema,
  emptyApplicantProfileForm,
  type ApplicantProfileFormInput,
} from '../features/applicants/applicantProfileSchema'
import {
  applicantRowToForm,
  fetchApplicantProfile,
  fetchCommunities,
  saveApplicantProfile,
  type CommunityOption,
} from '../features/applicants/applicantProfileService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

type FieldName = keyof ApplicantProfileFormInput

function setFieldValue(
  form: ApplicantProfileFormInput,
  fieldName: FieldName,
  value: string,
): ApplicantProfileFormInput {
  return {
    ...form,
    [fieldName]: value,
  }
}

export function ProfilePage() {
  const auth = useAuth()
  const { client, user } = auth
  const [form, setForm] = useState<ApplicantProfileFormInput>(emptyApplicantProfileForm)
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validation = useMemo(() => applicantProfileSchema.safeParse(form), [form])
  const firstValidationMessage = validation.success
    ? null
    : validation.error.issues[0]?.message

  useEffect(() => {
    if (!client || !user) {
      return
    }

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [loadedProfile, loadedCommunities] = await Promise.all([
          fetchApplicantProfile(client, user.id),
          fetchCommunities(client),
        ])

        setForm(applicantRowToForm(loadedProfile))
        setCommunities(loadedCommunities)
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadProfile()
  }, [client, user])

  const handleChange =
    (fieldName: FieldName) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((currentForm) => setFieldValue(currentForm, fieldName, event.target.value))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setMessage(null)

    if (!client || !user) {
      setError('You must be signed in to update your profile.')
      return
    }

    const parsed = applicantProfileSchema.safeParse(form)

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your profile details.')
      return
    }

    setIsSubmitting(true)

    try {
      await saveApplicantProfile(client, user.id, parsed.data)
      await auth.refreshUserContext()
      setMessage('Applicant profile saved.')
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="slate">Applicant entity</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">Profile</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Applicant profile data is separate from yearly grant applications so historical
          applications remain intact across future program years.
        </p>
      </div>

      <form
        className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            disabled={isLoading}
            label="First name"
            name="firstName"
            onChange={handleChange('firstName')}
            required
            value={form.firstName}
          />
          <TextField
            disabled={isLoading}
            label="Middle name"
            name="middleName"
            onChange={handleChange('middleName')}
            value={form.middleName ?? ''}
          />
          <TextField
            disabled={isLoading}
            label="Surname"
            name="surname"
            onChange={handleChange('surname')}
            required
            value={form.surname}
          />
          <TextField
            disabled={isLoading}
            label="Date of birth"
            name="dateOfBirth"
            onChange={handleChange('dateOfBirth')}
            type="date"
            value={form.dateOfBirth ?? ''}
          />
          <SelectField
            disabled={isLoading}
            label="Sex"
            name="sex"
            onChange={handleChange('sex')}
            value={form.sex ?? ''}
          >
            <option value="">Select sex</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </SelectField>
          <TextField
            disabled={isLoading}
            label="Clan"
            name="clan"
            onChange={handleChange('clan')}
            value={form.clan ?? ''}
          />
          <SelectField
            disabled={isLoading}
            label="Community"
            name="communityId"
            onChange={handleChange('communityId')}
            value={form.communityId ?? ''}
          >
            <option value="">Select community</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </SelectField>
          <TextField
            disabled={isLoading}
            label="Email"
            name="email"
            onChange={handleChange('email')}
            type="email"
            value={form.email ?? ''}
          />
          <TextField
            disabled={isLoading}
            label="Mobile phone"
            name="mobilePhone"
            onChange={handleChange('mobilePhone')}
            value={form.mobilePhone ?? ''}
          />
          <TextField
            disabled={isLoading}
            label="Telephone"
            name="telephone"
            onChange={handleChange('telephone')}
            value={form.telephone ?? ''}
          />
          <TextField
            className="md:col-span-2"
            disabled={isLoading}
            label="Residential/home address"
            name="residentialAddress"
            onChange={handleChange('residentialAddress')}
            value={form.residentialAddress ?? ''}
          />
          <TextField
            className="md:col-span-3"
            disabled={isLoading}
            label="Postal address"
            name="postalAddress"
            onChange={handleChange('postalAddress')}
            value={form.postalAddress ?? ''}
          />
        </div>

        {firstValidationMessage ? (
          <p className="mt-4 text-sm text-amber-800">{firstValidationMessage}</p>
        ) : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

        <div className="mt-5 flex justify-end">
          <Button disabled={isLoading || isSubmitting} type="submit">
            {isSubmitting ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </form>
    </section>
  )
}
