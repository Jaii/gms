import { NavLink, Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import { LogOut, ShieldCheck } from 'lucide-react'
import { navigationItems } from '../app/navigation'
import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/useAuth'
import type { NavigationRoleCode } from '../types/domain'

function canSeeNavigationItem(
  requiredRoles: NavigationRoleCode[],
  userRoles: NavigationRoleCode[],
): boolean {
  for (const role of requiredRoles) {
    if (userRoles.includes(role)) {
      return true
    }
  }

  return false
}

export function AppShell() {
  const auth = useAuth()
  const { isStaff, profile, roles, user } = auth
  const navigationRoles: NavigationRoleCode[] = isStaff
    ? [...roles.filter((role) => role !== 'applicant'), 'staff']
    : roles
  const visibleItems = navigationItems.filter((item) =>
    canSeeNavigationItem(item.roles, navigationRoles),
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden min-h-screen bg-slate-950 text-slate-200 shadow-xl lg:block">
        <div className="border-b border-slate-800 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-blue-600 text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">GMS</p>
              <h1 className="text-base font-semibold text-white">Grant Management</h1>
            </div>
          </div>
        </div>

        <nav aria-label="Main navigation" className="px-3 py-5">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Menu
          </p>
          <div className="mt-3 grid gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  className={({ isActive }) =>
                    clsx(
                      'flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                    )
                  }
                  end={item.href === '/applicant' || item.href === '/staff'}
                  key={`${item.href}-${item.label}`}
                  to={item.href}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 px-4 py-3 sm:px-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">GMS</p>
                <h1 className="text-lg font-semibold text-slate-950">
                  Grant Management System
                </h1>
              </div>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase text-slate-500">Workspace</p>
              <h2 className="text-lg font-semibold text-slate-950">
                Grant Management System
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Phase 2 auth and profile
              </div>
              <div className="text-sm text-slate-600">
                <span className="block font-medium text-slate-950">
                  {profile?.full_name ?? user?.email ?? 'Signed in'}
                </span>
                <span>{roles.length > 0 ? roles.join(', ') : 'No role assigned'}</span>
              </div>
              <Button
                aria-label="Sign out"
                className="gap-2"
                onClick={() => void auth.signOut()}
                variant="secondary"
              >
                <LogOut className="size-4" aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </div>

          <nav aria-label="Mobile navigation" className="bg-slate-950 lg:hidden">
            <div className="flex gap-1 overflow-x-auto px-4 py-2 sm:px-6">
              {visibleItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    className={({ isActive }) =>
                      clsx(
                        'flex min-h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition',
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-100 hover:bg-slate-800 hover:text-white',
                      )
                    }
                    end={item.href === '/applicant' || item.href === '/staff'}
                    key={`${item.href}-${item.label}`}
                    to={item.href}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </nav>
        </header>

        <main className="px-4 py-6 sm:px-6 xl:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
