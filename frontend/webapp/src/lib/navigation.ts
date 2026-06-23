import type { LucideIcon } from "lucide-react"
import {
  Building2,
  ClipboardList,
  HardHat,
  Inbox,
  LayoutDashboard,
  MapPinned,
  Package,
  ScrollText,
  UserCircle,
  Users,
  UserSquare2,
  BarChart3,
} from "lucide-react"

import { Role, type Role as RoleType } from "@/modules/auth/roles"

export type RouteMeta = {
  title: string
  description?: string
}

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
  roles: RoleType[]
  meta: RouteMeta
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

const ALL_ROLES = [
  Role.SENIOR_MANAGER_ES,
  Role.RA_ENVIRONMENT_HO,
  Role.WORLD_BANK_USER,
  Role.RA_ES_TEHSIL,
] as const

const PROCUREMENT_MANAGERS = [Role.SENIOR_MANAGER_ES, Role.RA_ENVIRONMENT_HO] as const

const PROCUREMENT_READERS = [
  Role.SENIOR_MANAGER_ES,
  Role.RA_ENVIRONMENT_HO,
  Role.WORLD_BANK_USER,
  Role.RA_ES_TEHSIL,
] as const

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard/senior-manager",
        icon: LayoutDashboard,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Dashboard",
          description: "System overview — users, offices, and audit activity",
        },
      },
      {
        label: "Dashboard",
        path: "/dashboard/ra-environment",
        icon: LayoutDashboard,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Dashboard",
          description: "Head Office overview — procurement and geography",
        },
      },
      {
        label: "Dashboard",
        path: "/dashboard/ra-tehsil",
        icon: LayoutDashboard,
        roles: [Role.RA_ES_TEHSIL],
        meta: {
          title: "Dashboard",
          description: "Tehsil overview — procurement and geography",
        },
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        label: "Users",
        path: "/dashboard/senior-manager/users",
        icon: Users,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Users",
          description: "Accounts by role — create, manage status, and jump to per-user audit activity",
        },
      },
      {
        label: "Offices",
        path: "/dashboard/senior-manager/offices",
        icon: Building2,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Offices",
          description: "Head Office, World Bank, and tehsil office directory",
        },
      },
      {
        label: "Audit logs",
        path: "/dashboard/senior-manager/audit-logs",
        icon: ScrollText,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Audit logs",
          description: "Who did what — user actions with performer and affected account details",
        },
      },
    ],
  },
  {
    label: "Procurement",
    items: [
      {
        label: "Packages",
        path: "/dashboard/senior-manager/procurement/packages",
        icon: Package,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Procurement packages",
          description: "Contracts linking contractors, consultants, tehsils, and villages",
        },
      },
      {
        label: "Contractors",
        path: "/dashboard/senior-manager/procurement/contractors",
        icon: HardHat,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Contractors",
          description: "Master list of contractors for procurement packages",
        },
      },
      {
        label: "Consultants",
        path: "/dashboard/senior-manager/procurement/consultants",
        icon: UserSquare2,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Consultants",
          description: "Master list of consultants for procurement packages",
        },
      },
      {
        label: "Packages",
        path: "/dashboard/ra-environment/procurement/packages",
        icon: Package,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Procurement packages",
          description: "Contracts linking contractors, consultants, tehsils, and villages",
        },
      },
      {
        label: "Contractors",
        path: "/dashboard/ra-environment/procurement/contractors",
        icon: HardHat,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Contractors",
          description: "Master list of contractors for procurement packages",
        },
      },
      {
        label: "Consultants",
        path: "/dashboard/ra-environment/procurement/consultants",
        icon: UserSquare2,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Consultants",
          description: "Master list of consultants for procurement packages",
        },
      },
      {
        label: "Packages",
        path: "/dashboard/world-bank/procurement/packages",
        icon: Package,
        roles: [Role.WORLD_BANK_USER],
        meta: {
          title: "Procurement packages",
          description: "Read-only view of all procurement packages",
        },
      },
      {
        label: "Packages",
        path: "/dashboard/ra-tehsil/procurement/packages",
        icon: Package,
        roles: [Role.RA_ES_TEHSIL],
        meta: {
          title: "Procurement packages",
          description:
            "Step 1: record ESMP baseline (mobilization date) for each package",
        },
      },
    ],
  },
  {
    label: "Surveys",
    items: [
      {
        label: "Survey forms",
        path: "/dashboard/senior-manager/surveys",
        icon: ClipboardList,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Survey forms",
          description: "Design forms and assign them to procurement packages",
        },
      },
      {
        label: "Responses",
        path: "/dashboard/senior-manager/surveys/responses",
        icon: Inbox,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Survey responses",
          description: "Site-visit submissions collected by tehsil RAs",
        },
      },
      {
        label: "Survey forms",
        path: "/dashboard/ra-environment/surveys",
        icon: ClipboardList,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Survey forms",
          description: "Design forms and assign them to procurement packages",
        },
      },
      {
        label: "Responses",
        path: "/dashboard/ra-environment/surveys/responses",
        icon: Inbox,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Survey responses",
          description: "Site-visit submissions collected by tehsil RAs",
        },
      },
      {
        label: "My surveys",
        path: "/dashboard/ra-tehsil/surveys",
        icon: ClipboardList,
        roles: [Role.RA_ES_TEHSIL],
        meta: {
          title: "My surveys",
          description:
            "ESMP baseline and village monitoring submissions for your tehsil",
        },
      },
    ],
  },
  {
    label: "Form dashboards",
    items: [
      {
        label: "Form dashboards",
        path: "/dashboard/senior-manager/form-dashboards",
        icon: BarChart3,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Form dashboards",
          description:
            "Per-form analytics — demographics, procurement linkage, and question insights",
        },
      },
      {
        label: "Form dashboards",
        path: "/dashboard/ra-environment/form-dashboards",
        icon: BarChart3,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Form dashboards",
          description:
            "Per-form analytics — demographics, procurement linkage, and question insights",
        },
      },
      {
        label: "Form dashboards",
        path: "/dashboard/world-bank/form-dashboards",
        icon: BarChart3,
        roles: [Role.WORLD_BANK_USER],
        meta: {
          title: "Form dashboards",
          description:
            "Per-form analytics — demographics, procurement linkage, and question insights",
        },
      },
    ],
  },
  {
    label: "Reference",
    items: [
      {
        label: "Geography",
        path: "/dashboard/senior-manager/geography",
        icon: MapPinned,
        roles: [Role.SENIOR_MANAGER_ES],
        meta: {
          title: "Geography",
          description: "Tehsils, villages, and settlements reference",
        },
      },
      {
        label: "Geography",
        path: "/dashboard/ra-environment/geography",
        icon: MapPinned,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Geography",
          description: "Tehsils, villages, and settlements reference",
        },
      },
      {
        label: "Geography",
        path: "/dashboard/ra-tehsil/geography",
        icon: MapPinned,
        roles: [Role.RA_ES_TEHSIL],
        meta: {
          title: "Geography",
          description: "Tehsils, villages, and settlements reference",
        },
      },
      {
        label: "Profile",
        path: "/dashboard/ra-environment/profile",
        icon: UserCircle,
        roles: [Role.RA_ENVIRONMENT_HO],
        meta: {
          title: "Profile",
          description: "Your account details",
        },
      },
      {
        label: "Profile",
        path: "/dashboard/ra-tehsil/profile",
        icon: UserCircle,
        roles: [Role.RA_ES_TEHSIL],
        meta: {
          title: "Profile",
          description: "Your account details",
        },
      },
    ],
  },
]

export function getNavGroupsForRole(role: RoleType): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0)
}

export function getRouteMeta(pathname: string): RouteMeta {
  const items = NAV_GROUPS.flatMap((group) => group.items)
  const exact = items.find((item) => item.path === pathname)
  if (exact) return exact.meta

  const prefix = items
    .filter((item) => pathname.startsWith(`${item.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]
  if (prefix) return prefix.meta

  return { title: "Dashboard" }
}

export function isNavItemActive(
  pathname: string,
  itemPath: string,
  peerPaths: string[] = [],
): boolean {
  if (
    itemPath.endsWith("/senior-manager") ||
    itemPath.endsWith("/ra-environment") ||
    itemPath.endsWith("/world-bank") ||
    itemPath.endsWith("/ra-tehsil")
  ) {
    return pathname === itemPath
  }
  if (pathname === itemPath) return true
  if (!pathname.startsWith(`${itemPath}/`)) return false

  const hasMoreSpecificPeer = peerPaths.some(
    (peer) =>
      peer !== itemPath &&
      peer.startsWith(`${itemPath}/`) &&
      (pathname === peer || pathname.startsWith(`${peer}/`)),
  )
  return !hasMoreSpecificPeer
}

export { ALL_ROLES, PROCUREMENT_MANAGERS, PROCUREMENT_READERS }
