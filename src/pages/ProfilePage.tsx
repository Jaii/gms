import { useEffect, useMemo, useState } from 'react'
import { Pencil, Save, X } from 'lucide-react'
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
type ProfileMode = 'view' | 'edit'

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

function formatDate(dateValue: string | null | undefined): string {
  if (!dateValue) {
    return 'Not provided'
  }

  const date = new Date(`${dateValue}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateValue
  }

  return new Intl.DateTimeFormat('en-PG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatChoice(value: string | null | undefined): string {
  if (!value) {
    return 'Not provided'
  }

  return value
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

function displayValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : 'Not provided'
}

function ProfileDetail({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  const isMissing = !value || value === 'Not provided'

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd
        className={
          isMissing ? 'mt-1 text-sm text-slate-400' : 'mt-1 font-semibold text-slate-950'
        }
      >
        {value ?? 'Not provided'}
      </dd>
    </div>
  )
}

export function ProfilePage() {
  const auth = useAuth()
  const { client, user } = auth
  const [form, setForm] = useState<ApplicantProfileFormInput>(emptyApplicantProfileForm)
  const [savedForm, setSavedForm] = useState<ApplicantProfileFormInput>(
    emptyApplicantProfileForm,
  )
  const [communities, setCommunities] = useState<CommunityOption[]>([])
  const [mode, setMode] = useState<ProfileMode>('view')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validation = useMemo(() => applicantProfileSchema.safeParse(form), [form])
  const firstValidationMessage = validation.success
    ? null
    : validation.error.issues[0]?.message
  const selectedCommunity = communities.find(
    (community) => community.id === form.communityId,
  )
  const isEditing = mode === 'edit'

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

        const loadedForm = applicantRowToForm(loadedProfile)
        setForm(loadedForm)
        setSavedForm(loadedForm)
        setMode(loadedProfile ? 'view' : 'edit')
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
      setSavedForm(form)
      setMode('view')
      setMessage('Applicant profile saved.')
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setForm(savedForm)
    setError(null)
    setMessage(null)
    setMode('view')
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <Badge tone="slate">Applicant entity</Badge>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Profile</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Applicant profile data is separate from yearly grant applications so
            historical applications remain intact across future program years.
          </p>
        </div>
        {!isEditing ? (
          <Button className="gap-2" onClick={() => setMode('edit')}>
            <Pencil className="size-4" aria-hidden="true" />
            Edit profile
          </Button>
        ) : null}
      </div>

      {!isEditing ? (
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          {isLoading ? (
            <p className="text-sm text-slate-600">Loading profile...</p>
          ) : (
            <dl className="grid gap-4 md:grid-cols-3">
              <ProfileDetail label="First name" value={displayValue(form.firstName)} />
              <ProfileDetail label="Middle name" value={displayValue(form.middleName)} />
              <ProfileDetail label="Surname" value={displayValue(form.surname)} />
              <ProfileDetail label="Date of birth" value={formatDate(form.dateOfBirth)} />
              <ProfileDetail label="Sex" value={formatChoice(form.sex)} />
              <ProfileDetail label="Clan" value={displayValue(form.clan)} />
              <ProfileDetail
                label="Community"
                value={selectedCommunity?.name ?? 'Not provided'}
              />
              <ProfileDetail label="Email" value={displayValue(form.email)} />
              <ProfileDetail
                label="Mobile phone"
                value={displayValue(form.mobilePhone)}
              />
              <ProfileDetail label="Telephone" value={displayValue(form.telephone)} />
              <ProfileDetail
                label="Residential/home address"
                value={displayValue(form.residentialAddress)}
              />
              <ProfileDetail
                label="Postal address"
                value={displayValue(form.postalAddress)}
              />
            </dl>
          )}
          {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
        </div>
      ) : (
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

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              className="gap-2"
              disabled={isLoading || isSubmitting}
              onClick={handleCancel}
              variant="secondary"
            >
              <X className="size-4" aria-hidden="true" />
              Cancel
            </Button>
            <Button className="gap-2" disabled={isLoading || isSubmitting} type="submit">
              <Save className="size-4" aria-hidden="true" />
              {isSubmitting ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
