import { NavLink, Outlet } from 'react-router-dom'
import { clsx } from 'clsx'
import { ShieldCheck } from 'lucide-react'
import { navigationItems } from '../app/navigation'

const currentDevelopmentRoles = ['applicant', 'staff'] as const

export function AppShell() {
  const visibleItems = navigationItems.filter((item) =>
    item.roles.some((role) => currentDevelopmentRoles.includes(role)),
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md bg-blue-700 text-white">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-slate-500">GMS</p>
              <h1 className="text-xl font-semibold text-slate-950">
                Grant Management System
              </h1>
            </div>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Phase 1 development foundation
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[17rem_1fr] lg:px-8">
        <aside className="h-fit rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <nav aria-label="Main navigation" className="grid gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  className={({ isActive }) =>
                    clsx(
                      'flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition',
                      isActive
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                    )
                  }
                  end={item.href === '/applicant'}
                  key={`${item.href}-${item.label}`}
                  to={item.href}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
