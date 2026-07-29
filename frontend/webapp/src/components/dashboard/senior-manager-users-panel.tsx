import { memo, useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Building2,
  Copy,
  KeyRound,
  Pencil,
  Plus,
  Power,
  ScrollText,
  Search,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import { DataPanel } from "@/components/common/data-panel"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import {
  UserCredentialsDialog,
  type UserCredentials,
} from "@/components/dashboard/user-credentials-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useDeleteUserMutation,
  useResetUserCredentialsMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from "@/hooks/api"
import type { User } from "@/modules/api/types"
import { Role, type Role as RoleType } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"
import {
  ROLE_LABELS,
  SM_CREATABLE_ROLES,
  usersCreatePath,
  usersEditPath,
  canDeleteTargetUser,
} from "@/lib/user-management"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"
import { roleBadgeClass, roleLabel, userInitials } from "@/lib/user-display"
import { getQueryViewState } from "@/lib/query-view-state"
import { cn } from "@/lib/utils"
import type { UserStatus } from "@/modules/api/types"

type UserSummaryCardProps = {
  label: string
  value: number
  hint?: string
  icon: ReactNode
  accentClassName?: string
}

function UserSummaryCard({
  label,
  value,
  hint,
  icon,
  accentClassName = "border-l-primary/70",
}: UserSummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm border-l-4",
        accentClassName,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  )
}

type UserTableRowProps = {
  user: User
  onViewCredentials: (user: User) => void
  onCopyEmail: (email: string) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  canAdminister: boolean
  canDelete: boolean
  showAuditLink: boolean
  isTogglingStatus: boolean
  isDeleting: boolean
}

const UserTableRow = memo(function UserTableRow({
  user,
  onViewCredentials,
  onCopyEmail,
  onToggleStatus,
  onDelete,
  canAdminister,
  canDelete,
  showAuditLink,
  isTogglingStatus,
  isDeleting,
}: UserTableRowProps) {
  const auditLink = `/dashboard/senior-manager/audit-logs?userId=${encodeURIComponent(user.id)}&userName=${encodeURIComponent(user.username)}`

  return (
    <TableRow className="group">
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback
              className={cn(
                "text-[10px] font-semibold",
                roleBadgeClass(user.role),
              )}
            >
              {userInitials(user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{user.username}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate">{user.email}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 opacity-0 group-hover:opacity-100"
                title="Copy email"
                onClick={() => onCopyEmail(user.email)}
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={cn("font-normal", roleBadgeClass(user.role))}>
            {roleLabel(user.role)}
          </Badge>
          {user.canManageUsers ? (
            <Badge variant="secondary" className="font-normal">
              User admin
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-2 rounded-full",
              user.status === "ACTIVE" ? "bg-emerald-500" : "bg-muted-foreground/40",
            )}
          />
          <span
            className={cn(
              "text-sm",
              user.status === "ACTIVE"
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {user.status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {user.officeName ? (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="size-3.5 shrink-0" />
            <span className="truncate">
              {user.tehsilName ? `${user.tehsilName} — ` : ""}
              {user.officeName}
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {showAuditLink ? (
            <Button
              variant="ghost"
              size="icon-sm"
              title="View audit activity"
              asChild
            >
              <Link to={auditLink}>
                <ScrollText className="size-4" />
              </Link>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            title="View credentials"
            onClick={() => onViewCredentials(user)}
          >
            <KeyRound className="size-4" />
          </Button>
          {canAdminister ? (
            <Button variant="ghost" size="icon-sm" title="Edit user" asChild>
              <Link to={usersEditPath(user.id)}>
                <Pencil className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Edit user"
              disabled
            >
              <Pencil className="size-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
            disabled={!canAdminister || isTogglingStatus}
            onClick={() => onToggleStatus(user)}
          >
            <Power className="size-4" />
          </Button>
          {canDelete ? (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete user"
              disabled={isDeleting}
              onClick={() => onDelete(user)}
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
})

export const SeniorManagerUsersPanel = memo(function SeniorManagerUsersPanel() {
  const { user: actor } = useAuth()
  const usersQuery = useUsersQuery()
  const updateUserStatusMutation = useUpdateUserStatusMutation()
  const deleteUserMutation = useDeleteUserMutation()
  const resetCredentialsMutation = useResetUserCredentialsMutation()

  const adminActor = useMemo(
    () => ({
      role: actor?.role ?? Role.SENIOR_MANAGER_ES,
      canManageUsers: actor?.canManageUsers,
    }),
    [actor],
  )
  const showAuditLink = adminActor.role === Role.SENIOR_MANAGER_ES

  const usersView = useMemo(() => getQueryViewState<User[]>(usersQuery), [usersQuery])
  const users = usersView.data

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL")
  const [roleTab, setRoleTab] = useState<"ALL" | RoleType>("ALL")
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [credentials, setCredentials] = useState<UserCredentials | null>(null)
  const [credentialsUserId, setCredentialsUserId] = useState<string | null>(null)
  const [credentialsTitle, setCredentialsTitle] = useState("User credentials")
  const [credentialsCanReset, setCredentialsCanReset] = useState(false)

  const userStats = useMemo(() => {
    const list = users ?? []
    return {
      total: list.length,
      active: list.filter((u) => u.status === "ACTIVE").length,
      inactive: list.filter((u) => u.status === "INACTIVE").length,
      withOffice: list.filter((u) => u.officeId).length,
    }
  }, [users])

  const roleCounts = useMemo(() => {
    const counts = new Map<RoleType, number>()
    for (const role of SM_CREATABLE_ROLES) counts.set(role, 0)
    for (const user of users ?? []) {
      counts.set(user.role, (counts.get(user.role) ?? 0) + 1)
    }
    return counts
  }, [users])

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (users ?? []).filter((user) => {
      if (roleTab !== "ALL" && user.role !== roleTab) return false
      if (statusFilter !== "ALL" && user.status !== statusFilter) return false
      if (!q) return true
      const haystack = [
        user.username,
        user.email,
        roleLabel(user.role),
        user.officeName,
        user.tehsilName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [roleTab, search, statusFilter, users])

  const handleToggleStatus = useCallback(
    async (user: User) => {
      const nextActive = user.status !== "ACTIVE"

      try {
        await updateUserStatusMutation.mutateAsync({
          userId: user.id,
          active: nextActive,
        })
        toast.success(nextActive ? "User activated" : "User deactivated")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update status")
      }
    },
    [updateUserStatusMutation],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteUser) return

    try {
      await deleteUserMutation.mutateAsync(deleteUser.id)
      toast.success("User deleted")
      setDeleteUser(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user")
    }
  }, [deleteUser, deleteUserMutation])

  const handleCopyEmail = useCallback(async (email: string) => {
    try {
      await copyTextToClipboard(email)
      toast.success("Email copied")
    } catch {
      toast.error("Failed to copy email")
    }
  }, [])

  const handleViewCredentials = useCallback(
    (user: User) => {
      setCredentialsUserId(user.id)
      setCredentialsTitle(`Credentials — ${user.username}`)
      setCredentials({
        username: user.username,
        email: user.email,
        password: null,
      })
      setCredentialsCanReset(canDeleteTargetUser(adminActor, user.role))
      setCredentialsOpen(true)
    },
    [adminActor],
  )

  const handleResetPassword = useCallback(async () => {
    if (!credentialsUserId) return

    try {
      const result = await resetCredentialsMutation.mutateAsync(credentialsUserId)
      setCredentials({
        username: result.username,
        email: result.email,
        password: result.temporaryPassword,
      })
      toast.success("New temporary password generated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password")
    }
  }, [credentialsUserId, resetCredentialsMutation])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UserSummaryCard
          label="Total users"
          value={userStats.total}
          hint="All registered accounts"
          icon={<Users className="size-4" />}
          accentClassName="border-l-blue-500/70"
        />
        <UserSummaryCard
          label="Active"
          value={userStats.active}
          hint="Can sign in now"
          icon={<UserCheck className="size-4" />}
          accentClassName="border-l-emerald-500/70"
        />
        <UserSummaryCard
          label="Inactive"
          value={userStats.inactive}
          hint="Deactivated accounts"
          icon={<UserMinus className="size-4" />}
          accentClassName="border-l-amber-500/70"
        />
        <UserSummaryCard
          label="Office-linked"
          value={userStats.withOffice}
          hint="HO, World Bank & tehsil"
          icon={<Building2 className="size-4" />}
          accentClassName="border-l-violet-500/70"
        />
      </div>

      <DataPanel
        title="User accounts"
        description="Manage accounts by role — create users, assign offices, and review activity"
        action={
          <Button size="sm" asChild>
            <Link to={usersCreatePath()}>
              <Plus className="mr-2 size-4" />
              Create user
            </Link>
          </Button>
        }
        contentClassName="space-y-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role, or office…"
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as "ALL" | UserStatus)}
          >
            <SelectTrigger className="w-full lg:w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active only</SelectItem>
              <SelectItem value="INACTIVE">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs
          value={roleTab}
          onValueChange={(value) => setRoleTab(value as "ALL" | RoleType)}
        >
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="ALL" className="px-3">
              All ({users?.length ?? 0})
            </TabsTrigger>
            {SM_CREATABLE_ROLES.map((role) => (
              <TabsTrigger key={role} value={role} className="px-3">
                {ROLE_LABELS[role]} ({roleCounts.get(role) ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {usersView.error ? (
          <p className="text-sm text-destructive">{usersView.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={usersView.isInitialLoading}
            isRefreshing={usersView.isRefreshing}
            shimmer={<TableRowsShimmer rows={6} columns={5} />}
          >
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                <Users className="mb-3 size-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">No users match your filters</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try a different role tab or clear your search.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Showing {filteredUsers.length} of {users?.length ?? 0} users
                  {roleTab !== "ALL" ? ` in ${ROLE_LABELS[roleTab]}` : ""}
                </p>
                <Table className="enterprise-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        onViewCredentials={handleViewCredentials}
                        onCopyEmail={(email) => void handleCopyEmail(email)}
                        onToggleStatus={(selected) => void handleToggleStatus(selected)}
                        onDelete={setDeleteUser}
                        canAdminister={canDeleteTargetUser(adminActor, user.role)}
                        canDelete={canDeleteTargetUser(adminActor, user.role)}
                        showAuditLink={showAuditLink}
                        isTogglingStatus={updateUserStatusMutation.isPending}
                        isDeleting={deleteUserMutation.isPending}
                      />
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </ShimmerContainer>
        )}
      </DataPanel>

      <AlertDialog open={Boolean(deleteUser)} onOpenChange={(open) => !open && setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteUser?.username} ({deleteUser?.email}). This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteUserMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void handleConfirmDelete()
              }}
            >
              {deleteUserMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UserCredentialsDialog
        open={credentialsOpen}
        onOpenChange={setCredentialsOpen}
        credentials={credentials}
        title={credentialsTitle}
        canResetPassword={Boolean(credentialsUserId) && credentialsCanReset}
        isResetting={resetCredentialsMutation.isPending}
        onResetPassword={() => void handleResetPassword()}
      />
    </div>
  )
})
