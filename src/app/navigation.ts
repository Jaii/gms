import {
  ClipboardCheck,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  Settings,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NavigationRoleCode } from '../types/domain'

export type NavigationItem = {
  label: string
  href: string
  icon: LucideIcon
  roles: NavigationRoleCode[]
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', href: '/applicant', icon: Home, roles: ['applicant'] },
  {
    label: 'New Application',
    href: '/applications/new',
    icon: FileText,
    roles: ['applicant'],
  },
  { label: 'Documents', href: '/documents', icon: FolderOpen, roles: ['applicant'] },
  { label: 'Profile', href: '/profile', icon: UserRound, roles: ['applicant'] },
  { label: 'Staff Dashboard', href: '/staff', icon: LayoutDashboard, roles: ['staff'] },
  {
    label: 'Review Queue',
    href: '/staff/applications',
    icon: ClipboardCheck,
    roles: ['staff'],
  },
  { label: 'Administration', href: '/staff', icon: Settings, roles: ['staff'] },
]
