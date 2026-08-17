import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, Plus, Save, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import {
  applicationDraftSchema,
  createEmptyEducationRecord,
  emptyApplicationDraftForm,
  type ApplicationDraftFormInput,
  type EducationRecordInput,
} from '../features/applications/applicationDraftSchema'
import {
  draftContextToForm,
  fetchDraftApplicationContext,
  saveDraftApplication,
  type DraftApplicationContext,
} from '../features/applications/applicationDraftService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

const wizardSteps = [
  'Applicant',
  'Education',
  'Current Study',
  'Eligibility',
  'Additional Info',
  'Review',
] as const

type WizardStep = (typeof wizardSteps)[number]
type CurrentStudyField = keyof ApplicationDraftFormInput['currentStudy']
type EducationField = keyof Omit<EducationRecordInput, 'localId'>

function valueOrDash(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : 'Not provided'
}

function formatMoney(value: string): string {
  if (!value) {
    return 'Not provided'
  }

  const parsed = Number.parseFloat(value)

  if (Number.isNaN(parsed)) {
    return value
  }

  return parsed.toLocaleString('en-PG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getCompletionItems(form: ApplicationDraftFormInput) {
  return [
    { label: 'Applicant profile', complete: true },
    { label: 'Education history', complete: form.educationHistory.length > 0 },
    {
      label: 'Institution',
      complete: form.currentStudy.institutionName.trim().length > 0,
    },
    {
      label: 'Proposed course',
      complete: form.currentStudy.proposedCourse.trim().length > 0,
    },
    {
      label: 'Tuition fee',
      complete: form.currentStudy.tuitionFee.trim().length > 0,
    },
  ]
}

export function NewApplicationPage() {
  const { client, user } = useAuth()
  const [context, setContext] = useState<DraftApplicationContext | null>(null)
  const [form, setForm] = useState<ApplicationDraftFormInput>(emptyApplicationDraftForm)
  const [activeStep, setActiveStep] = useState<WizardStep>('Applicant')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const activeStepIndex = wizardSteps.indexOf(activeStep)
  const completionItems = useMemo(() => getCompletionItems(form), [form])
  const completionCount = completionItems.filter((item) => item.complete).length

  useEffect(() => {
    if (!client || !user) {
      return
    }

    const loadDraft = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const loadedContext = await fetchDraftApplicationContext(client, user.id)
        setContext(loadedContext)
        setForm(draftContextToForm(loadedContext))
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      } finally {
        setIsLoading(false)
      }
    }

    void loadDraft()
  }, [client, user])

  const updateCurrentStudy = (field: CurrentStudyField, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      currentStudy: { ...currentForm.currentStudy, [field]: value },
    }))
  }

  const updateEducationRecord = (
    localId: string,
    field: EducationField,
    value: string,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      educationHistory: currentForm.educationHistory.map((record) =>
        record.localId === localId ? { ...record, [field]: value } : record,
      ),
    }))
  }

  const addEducationRecord = (
    educationLevel: EducationRecordInput['educationLevel'] = 'secondary',
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      educationHistory: [
        ...currentForm.educationHistory,
        createEmptyEducationRecord(educationLevel),
      ],
    }))
  }

  const removeEducationRecord = (localId: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      educationHistory: currentForm.educationHistory.filter(
        (record) => record.localId !== localId,
      ),
    }))
  }

  const saveDraft = async () => {
    setError(null)
    setMessage(null)

    if (!client || !user || !context) {
      setError('Unable to save until the application context finishes loading.')
      return
    }

    const parsed = applicationDraftSchema.safeParse(form)

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check your draft application.')
      return
    }

    setIsSaving(true)

    try {
      await saveDraftApplication(client, user.id, context, parsed.data)
      const refreshedContext = await fetchDraftApplicationContext(client, user.id)
      setContext(refreshedContext)
      setForm(draftContextToForm(refreshedContext))
      setMessage('Draft application saved.')
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setIsSaving(false)
    }
  }

  const goToPreviousStep = () => {
    setActiveStep(wizardSteps[Math.max(activeStepIndex - 1, 0)] ?? 'Applicant')
  }

  const goToNextStep = () => {
    setActiveStep(
      wizardSteps[Math.min(activeStepIndex + 1, wizardSteps.length - 1)] ?? 'Review',
    )
  }

  if (isLoading) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="amber">Draft wizard</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">New application</h2>
        <p className="mt-2 text-sm text-slate-600">Loading your draft workspace...</p>
      </section>
    )
  }

  if (!context?.applicant) {
    return (
      <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="amber">Profile required</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Complete your profile first
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          GMS needs your applicant profile before it can create a grant application draft.
        </p>
        <Link className="mt-5 inline-flex" to="/profile">
          <Button>Go to profile</Button>
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="amber">Draft application</Badge>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {context.grantProgram.name}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Save a draft application for the {context.grantProgram.program_year}{' '}
              program. Submission, declaration and document uploads will come after the
              draft flow is stable.
            </p>
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-semibold text-slate-950">
              {context.application?.application_number ?? 'Draft reference pending'}
            </p>
            <p className="mt-1 text-slate-600">
              {completionCount} of {completionItems.length} key items complete
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <div className="grid gap-2 md:grid-cols-6">
          {wizardSteps.map((step, index) => (
            <button
              className={clsx(
                'min-h-11 rounded-md border px-3 text-left text-sm font-semibold transition',
                step === activeStep
                  ? 'border-blue-200 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
              key={step}
              onClick={() => setActiveStep(step)}
              type="button"
            >
              <span className="block text-xs font-medium text-slate-500">
                Step {index + 1}
              </span>
              {step}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        {activeStep === 'Applicant' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Applicant details</h3>
              <p className="mt-1 text-sm text-slate-600">
                These details come from your saved profile.
              </p>
            </div>
            <dl className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Full name</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {context.applicant.first_name} {context.applicant.middle_name ?? ''}{' '}
                  {context.applicant.surname}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Email</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {valueOrDash(context.applicant.email)}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Mobile phone</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {valueOrDash(context.applicant.mobile_phone)}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Clan</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {valueOrDash(context.applicant.clan)}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                <dt className="text-sm text-slate-600">Address</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {valueOrDash(context.applicant.residential_address)}
                </dd>
              </div>
            </dl>
            <Link className="inline-flex" to="/profile">
              <Button variant="secondary">View profile</Button>
            </Link>
          </div>
        ) : null}

        {activeStep === 'Education' ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">
                  Education history
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Add secondary and previous tertiary education records.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  className="gap-2"
                  onClick={() => addEducationRecord('secondary')}
                  variant="secondary"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Secondary
                </Button>
                <Button
                  className="gap-2"
                  onClick={() => addEducationRecord('tertiary')}
                  variant="secondary"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Tertiary
                </Button>
              </div>
            </div>

            {form.educationHistory.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No education records added yet.
              </div>
            ) : null}

            <div className="space-y-4">
              {form.educationHistory.map((record, index) => (
                <div
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  key={record.localId}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-950">
                      Education record {index + 1}
                    </p>
                    <Button
                      aria-label="Remove education record"
                      className="gap-2"
                      onClick={() => removeEducationRecord(record.localId)}
                      variant="secondary"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <SelectField
                      label="Education level"
                      name={`educationLevel-${record.localId}`}
                      onChange={(event) =>
                        updateEducationRecord(
                          record.localId,
                          'educationLevel',
                          event.target.value,
                        )
                      }
                      value={record.educationLevel}
                    >
                      <option value="secondary">Secondary</option>
                      <option value="tertiary">Tertiary</option>
                      <option value="other">Other</option>
                    </SelectField>
                    <TextField
                      label="Grade level"
                      name={`gradeLevel-${record.localId}`}
                      onChange={(event) =>
                        updateEducationRecord(
                          record.localId,
                          'gradeLevel',
                          event.target.value,
                        )
                      }
                      placeholder="Grade 10 or Grade 12"
                      value={record.gradeLevel ?? ''}
                    />
                    <TextField
                      label="School / institution"
                      name={`schoolName-${record.localId}`}
                      onChange={(event) =>
                        updateEducationRecord(
                          record.localId,
                          'schoolName',
                          event.target.value,
                        )
                      }
                      value={record.schoolName ?? ''}
                    />
                    <TextField
                      label="Course"
                      name={`course-${record.localId}`}
                      onChange={(event) =>
                        updateEducationRecord(
                          record.localId,
                          'course',
                          event.target.value,
                        )
                      }
                      value={record.course ?? ''}
                    />
                    <TextField
                      label="Year graduated"
                      name={`yearGraduated-${record.localId}`}
                      onChange={(event) =>
                        updateEducationRecord(
                          record.localId,
                          'yearGraduated',
                          event.target.value,
                        )
                      }
                      type="number"
                      value={record.yearGraduated ?? ''}
                    />
                    <TextField
                      label="Award"
                      name={`award-${record.localId}`}
                      onChange={(event) =>
                        updateEducationRecord(record.localId, 'award', event.target.value)
                      }
                      value={record.award ?? ''}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 'Current Study' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Current or proposed tertiary study
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Money fields are saved as PostgreSQL numeric values.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Institution"
                name="institutionName"
                onChange={(event) =>
                  updateCurrentStudy('institutionName', event.target.value)
                }
                required
                value={form.currentStudy.institutionName}
              />
              <TextField
                label="Proposed course"
                name="proposedCourse"
                onChange={(event) =>
                  updateCurrentStudy('proposedCourse', event.target.value)
                }
                required
                value={form.currentStudy.proposedCourse}
              />
              <SelectField
                label="Student type"
                name="studentType"
                onChange={(event) =>
                  updateCurrentStudy('studentType', event.target.value)
                }
                value={form.currentStudy.studentType}
              >
                <option value="new">New</option>
                <option value="continuing">Continuing</option>
              </SelectField>
              <TextField
                label="Duration of course months"
                name="durationMonths"
                onChange={(event) =>
                  updateCurrentStudy('durationMonths', event.target.value)
                }
                type="number"
                value={form.currentStudy.durationMonths ?? ''}
              />
              <TextField
                label="Year of study"
                name="yearOfStudy"
                onChange={(event) =>
                  updateCurrentStudy('yearOfStudy', event.target.value)
                }
                type="number"
                value={form.currentStudy.yearOfStudy ?? ''}
              />
              <TextField
                label="Currency"
                maxLength={3}
                name="currency"
                onChange={(event) =>
                  updateCurrentStudy('currency', event.target.value.toUpperCase())
                }
                value={form.currentStudy.currency}
              />
              <TextField
                label="Total course fee"
                name="totalCourseFee"
                onChange={(event) =>
                  updateCurrentStudy('totalCourseFee', event.target.value)
                }
                type="number"
                value={form.currentStudy.totalCourseFee ?? ''}
              />
              <TextField
                label="Tuition fee"
                name="tuitionFee"
                onChange={(event) => updateCurrentStudy('tuitionFee', event.target.value)}
                type="number"
                value={form.currentStudy.tuitionFee ?? ''}
              />
            </div>
          </div>
        ) : null}

        {activeStep === 'Eligibility' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Community and eligibility preview
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Phase 3 records the applicant and study facts. Final eligibility
                assessment remains auditable and staff-reviewed.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {completionItems.map((item) => (
                <div
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                  key={item.label}
                >
                  <span
                    className={clsx(
                      'flex size-7 items-center justify-center rounded-full border',
                      item.complete
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-800',
                    )}
                  >
                    <Check className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {activeStep === 'Additional Info' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">
                Additional information
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Add any context relevant to this application.
              </p>
            </div>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              <span>Additional information</span>
              <textarea
                className="min-h-40 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-blue-600"
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    additionalInformation: event.target.value,
                  }))
                }
                value={form.additionalInformation ?? ''}
              />
            </label>
          </div>
        ) : null}

        {activeStep === 'Review' ? (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">Review draft</h3>
              <p className="mt-1 text-sm text-slate-600">
                Review the draft information before saving. Submission will be added in
                the next phase.
              </p>
            </div>
            <dl className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Institution</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {valueOrDash(form.currentStudy.institutionName)}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Proposed course</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {valueOrDash(form.currentStudy.proposedCourse)}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Student type</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {form.currentStudy.studentType}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <dt className="text-sm text-slate-600">Tuition fee</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {form.currentStudy.currency}{' '}
                  {formatMoney(form.currentStudy.tuitionFee ?? '')}
                </dd>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2">
                <dt className="text-sm text-slate-600">Education records</dt>
                <dd className="mt-1 font-semibold text-slate-950">
                  {form.educationHistory.length}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        {message ? <p className="mt-5 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-5 text-sm text-red-700">{error}</p> : null}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Button
          className="gap-2"
          disabled={activeStepIndex === 0}
          onClick={goToPreviousStep}
          variant="secondary"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="gap-2"
            disabled={isSaving}
            onClick={() => void saveDraft()}
            variant="secondary"
          >
            <Save className="size-4" aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save draft'}
          </Button>
          <Button
            className="gap-2"
            disabled={activeStepIndex === wizardSteps.length - 1}
            onClick={goToNextStep}
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  )
}
