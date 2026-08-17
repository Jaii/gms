import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { MetricCard } from '../components/ui/MetricCard'
import { SelectField } from '../components/ui/SelectField'
import { TextField } from '../components/ui/TextField'
import {
  createEmptyStaffDashboardCounts,
  fetchStaffDashboardCounts,
  fetchStaffApplicationQueue,
  reviewStatusCodes,
  type StaffApplicationQueueItem,
  type StaffDashboardCounts,
  type StaffReviewStatusFilter,
} from '../features/staff/staffReviewService'
import { useAuth } from '../features/auth/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

const pageSize = 25

function applicantName(application: StaffApplicationQueueItem): string {
  return `${application.applicant_first_name} ${application.applicant_surname}`
}

function statusLabel(statusCode: string): string {
  return statusCode
    .split('_')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
}

export function StaffApplicationsPage() {
  const { client } = useAuth()
  const [applications, setApplications] = useState<StaffApplicationQueueItem[]>([])
  const [counts, setCounts] = useState<StaffDashboardCounts>(
    createEmptyStaffDashboardCounts(),
  )
  const [page, setPage] = useState(0)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StaffReviewStatusFilter>('all')
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const totalReviewCount = useMemo(
    () => Object.values(counts).reduce((total, count) => total + count, 0),
    [counts],
  )
  const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1)

  useEffect(() => {
    if (!client) {
      return
    }

    const loadApplications = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [queueResult, dashboardCounts] = await Promise.all([
          fetchStaffApplicationQueue(client, {
            page,
            pageSize,
            search,
            statusFilter,
          }),
          fetchStaffDashboardCounts(client),
        ])
        setApplications(queueResult.items)
        setTotalCount(queueResult.totalCount)
        setCounts(dashboardCounts)
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      } finally {
        setIsLoading(false)
      }
    }

    window.setTimeout(() => {
      void loadApplications()
    }, 0)
  }, [client, page, search, statusFilter])

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPage(0)
    setSearch(searchDraft)
  }

  const handleStatusFilterChange = (value: StaffReviewStatusFilter) => {
    setPage(0)
    setStatusFilter(value)
  }

  return (
    <section className="space-y-6">
      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
        <Badge tone="green">Review queue</Badge>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950">
          Submitted applications
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Review submitted applications, check supporting information, and move them
          through staff workflow statuses.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Filtered total"
          value={isLoading ? 'Loading' : String(totalCount)}
          supportingText="Submitted and active review"
        />
        <MetricCard
          label="New submissions"
          value={String(counts.submitted)}
          supportingText="Awaiting initial review"
        />
        <MetricCard
          label="All active review"
          value={String(totalReviewCount)}
          supportingText="All review statuses"
        />
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <form
        className="grid gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_16rem_auto]"
        onSubmit={handleSearch}
      >
        <TextField
          label="Search"
          name="search"
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Applicant name or reference number"
          value={searchDraft}
        />
        <SelectField
          label="Status"
          name="status"
          onChange={(event) =>
            handleStatusFilterChange(event.target.value as StaffReviewStatusFilter)
          }
          value={statusFilter}
        >
          <option value="all">All active statuses</option>
          {reviewStatusCodes.map((statusCode) => (
            <option key={statusCode} value={statusCode}>
              {statusLabel(statusCode)}
            </option>
          ))}
        </SelectField>
        <Button className="self-end" disabled={isLoading} type="submit">
          Search
        </Button>
      </form>

      <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
        <div className="grid min-w-[52rem] grid-cols-[1.4fr_1fr_1fr_1fr_7rem] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          <span>Applicant</span>
          <span>Reference</span>
          <span>Status</span>
          <span>Documents</span>
          <span>Action</span>
        </div>
        {applications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-600">
            {isLoading ? 'Loading applications...' : 'No submitted applications yet.'}
          </p>
        ) : null}
        {applications.map((item) => (
          <div
            className="grid min-w-[52rem] grid-cols-[1.4fr_1fr_1fr_1fr_7rem] items-center gap-4 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0"
            key={item.application_id}
          >
            <div>
              <p className="font-semibold text-slate-950">{applicantName(item)}</p>
              <p className="text-slate-500">{item.proposed_course}</p>
            </div>
            <span className="font-medium text-slate-800">
              {item.application_number ?? 'Pending'}
            </span>
            <Badge tone={item.status_code === 'submitted' ? 'blue' : 'amber'}>
              {item.status_name}
            </Badge>
            <span className="text-slate-700">{item.document_count}</span>
            <Link
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              to={`/staff/applications/${item.application_id}`}
            >
              <Eye className="size-4" aria-hidden="true" />
              Open
            </Link>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          Page {page + 1} of {totalPages}, showing {applications.length} of {totalCount}{' '}
          matching applications.
        </p>
        <div className="flex gap-2">
          <Button
            disabled={isLoading || page === 0}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 0))}
            variant="secondary"
          >
            Previous
          </Button>
          <Button
            disabled={isLoading || page + 1 >= totalPages}
            onClick={() => setPage((currentPage) => currentPage + 1)}
            variant="secondary"
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  )
}
