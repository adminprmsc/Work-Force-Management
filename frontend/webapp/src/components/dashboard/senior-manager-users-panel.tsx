import { memo, useCallback, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  Building2,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Pencil,
  Plus,
  Power,
  RefreshCw,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
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
  useCreateUserMutation,
  useDeleteUserMutation,
  useOfficesQuery,
  useResetUserCredentialsMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
  useUsersQuery,
} from "@/hooks/api"
import type { Office, User } from "@/modules/api/types"
import { Role, type Role as RoleType } from "@/modules/auth/roles"
import {
  CREATABLE_ROLES,
  ROLE_LABELS,
  formatOfficeOption,
  officesForRole,
  roleRequiresOffice,
} from "@/lib/user-management"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"
import { roleBadgeClass, roleLabel, userInitials } from "@/lib/user-display"
import { getQueryViewState, mergeQueryViewStates } from "@/lib/query-view-state"
import { cn } from "@/lib/utils"
import type { UserStatus } from "@/modules/api/types"

const EMAIL_DOMAIN = "ens.com"
const DEFAULT_PASSWORD = "Root123!"

// Users only type the local part; keep state free of "@" and the domain.
function sanitizeEmailLocalPart(value: string): string {
  return value.split("@")[0].replace(/\s/g, "")
}

function randomChar(set: string): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return set[buf[0] % set.length]
}

// Strong password with at least one upper, lower, digit, and symbol.
// Ambiguous characters (0/O, 1/l/I) are excluded for legibility.
function generatePassword(length = 14): string {
  const groups = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%^&*",
  ]
  const all = groups.join("")
  const chars = groups.map(randomChar)
  while (chars.length < length) chars.push(randomChar(all))
  for (let i = chars.length - 1; i > 0; i--) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const j = buf[0] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

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
        "rounded-lg border border-border/80 bg-card px-4 py-3 shadow-sm",
        "border-l-4",
        accentClassName,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
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
  onEditEmail: (user: User) => void
  onViewCredentials: (user: User) => void
  onCopyEmail: (email: string) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  isTogglingStatus: boolean
  isDeleting: boolean
}

const UserTableRow = memo(function UserTableRow({
  user,
  onEditEmail,
  onViewCredentials,
  onCopyEmail,
  onToggleStatus,
  onDelete,
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
        <Badge variant="outline" className={cn("font-normal", roleBadgeClass(user.role))}>
          {roleLabel(user.role)}
        </Badge>
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
          <Button
            variant="ghost"
            size="icon-sm"
            title="View credentials"
            onClick={() => onViewCredentials(user)}
          >
            <KeyRound className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Edit email"
            onClick={() => onEditEmail(user)}
          >
            <Mail className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title={user.status === "ACTIVE" ? "Deactivate" : "Activate"}
            disabled={isTogglingStatus}
            onClick={() => onToggleStatus(user)}
          >
            <Power className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Delete user"
            disabled={isDeleting}
            onClick={() => onDelete(user)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

export const SeniorManagerUsersPanel = memo(function SeniorManagerUsersPanel() {
  const usersQuery = useUsersQuery()
  const officesQuery = useOfficesQuery()
  const createUserMutation = useCreateUserMutation()
  const updateUserMutation = useUpdateUserMutation()
  const updateUserStatusMutation = useUpdateUserStatusMutation()
  const deleteUserMutation = useDeleteUserMutation()
  const resetCredentialsMutation = useResetUserCredentialsMutation()

  const usersView = useMemo(() => getQueryViewState<User[]>(usersQuery), [usersQuery])
  const officesView = useMemo(() => getQueryViewState<Office[]>(officesQuery), [officesQuery])
  const viewState = useMemo(
    () => mergeQueryViewStates([usersView, officesView]),
    [officesView, usersView],
  )

  const users = usersView.data

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | UserStatus>("ALL")
  const [roleTab, setRoleTab] = useState<"ALL" | RoleType>("ALL")

  const [createOpen, setCreateOpen] = useState(false)
  const [createRole, setCreateRole] = useState<RoleType>(Role.RA_ENVIRONMENT_HO)
  const [createOfficeId, setCreateOfficeId] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createUsername, setCreateUsername] = useState("")
  const [createPassword, setCreatePassword] = useState(DEFAULT_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState("")

  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [credentials, setCredentials] = useState<UserCredentials | null>(null)
  const [credentialsUserId, setCredentialsUserId] = useState<string | null>(null)
  const [credentialsTitle, setCredentialsTitle] = useState("User credentials")

  const availableOffices = useMemo(
    () => officesForRole(officesView.data ?? [], createRole),
    [createRole, officesView.data],
  )

  const needsOffice = roleRequiresOffice(createRole)

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
    for (const role of CREATABLE_ROLES) counts.set(role, 0)
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

  const resolvedCreateOfficeId = useMemo(() => {
    if (!needsOffice) return ""
    if (availableOffices.length === 1) return availableOffices[0]!.id
    if (
      createOfficeId &&
      availableOffices.some((office) => office.id === createOfficeId)
    ) {
      return createOfficeId
    }
    return ""
  }, [availableOffices, createOfficeId, needsOffice])

  const canCreate = useMemo(() => {
    if (!createEmail.trim() || !createUsername.trim() || createPassword.length < 8) {
      return false
    }
    if (needsOffice && !resolvedCreateOfficeId) {
      return false
    }
    return true
  }, [createEmail, createPassword, createUsername, needsOffice, resolvedCreateOfficeId])

  const handleEditEmail = useCallback((user: User) => {
    setEditUser(user)
    setEditEmail(user.email)
  }, [])

  const resetCreateForm = useCallback(() => {
    setCreateRole(Role.RA_ENVIRONMENT_HO)
    setCreateOfficeId("")
    setCreateEmail("")
    setCreateUsername("")
    setCreatePassword(DEFAULT_PASSWORD)
    setShowPassword(false)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!canCreate) return

    const email = `${createEmail.trim()}@${EMAIL_DOMAIN}`
    const username = createUsername.trim()

    try {
      await createUserMutation.mutateAsync({
        email,
        username,
        password: createPassword,
        role: createRole,
        officeId: needsOffice ? resolvedCreateOfficeId : undefined,
      })
      toast.success(`${ROLE_LABELS[createRole]} user created`)
      setCreateOpen(false)
      resetCreateForm()
      setCredentialsUserId(null)
      setCredentialsTitle("New user credentials")
      setCredentials({ username, email, password: createPassword })
      setCredentialsOpen(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    }
  }, [
    canCreate,
    createEmail,
    createPassword,
    createRole,
    createUserMutation,
    createUsername,
    needsOffice,
    resetCreateForm,
    resolvedCreateOfficeId,
  ])

  const handleSaveEmail = useCallback(async () => {
    if (!editUser) return

    try {
      await updateUserMutation.mutateAsync({
        userId: editUser.id,
        input: { email: editEmail.trim() },
      })
      toast.success("Email updated")
      setEditUser(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update email")
    }
  }, [editEmail, editUser, updateUserMutation])

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

  const handleViewCredentials = useCallback((user: User) => {
    setCredentialsUserId(user.id)
    setCredentialsTitle(`Credentials — ${user.username}`)
    setCredentials({
      username: user.username,
      email: user.email,
      password: null,
    })
    setCredentialsOpen(true)
  }, [])

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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create user
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
            {CREATABLE_ROLES.map((role) => (
              <TabsTrigger key={role} value={role} className="px-3">
                {ROLE_LABELS[role]} ({roleCounts.get(role) ?? 0})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {viewState.error ? (
          <p className="text-sm text-destructive">{viewState.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={viewState.isInitialLoading}
            isRefreshing={viewState.isRefreshing}
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
                        onEditEmail={handleEditEmail}
                        onViewCredentials={handleViewCredentials}
                        onCopyEmail={(email) => void handleCopyEmail(email)}
                        onToggleStatus={(selected) => void handleToggleStatus(selected)}
                        onDelete={setDeleteUser}
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

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>
              Choose a role and assign the matching office when required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-role">Role</Label>
              <Select
                value={createRole}
                onValueChange={(value) => {
                  setCreateRole(value as RoleType)
                  setCreateOfficeId("")
                }}
              >
                <SelectTrigger id="create-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {CREATABLE_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsOffice ? (
              <div className="grid gap-2">
                <Label htmlFor="create-office">Office</Label>
                {availableOffices.length > 0 ? (
                  <Select
                    value={resolvedCreateOfficeId}
                    onValueChange={setCreateOfficeId}
                  >
                    <SelectTrigger id="create-office" className="w-full">
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOffices.map((office) => (
                        <SelectItem key={office.id} value={office.id}>
                          {formatOfficeOption(office)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No office available for this role. Run database seed first.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Senior Manager accounts are not tied to an office.
              </p>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-email">Email</Label>
              <InputGroup>
                <InputGroupInput
                  id="create-email"
                  value={createEmail}
                  onChange={(e) =>
                    setCreateEmail(sanitizeEmailLocalPart(e.target.value))
                  }
                  placeholder="username"
                  autoComplete="off"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>@{EMAIL_DOMAIN}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-username">Username</Label>
              <Input
                id="create-username"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                placeholder="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-password">Password</Label>
              <InputGroup>
                <InputGroupInput
                  id="create-password"
                  type={showPassword ? "text" : "password"}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </InputGroupButton>
                  <InputGroupButton
                    onClick={() => {
                      setCreatePassword(generatePassword())
                      setShowPassword(true)
                    }}
                  >
                    <RefreshCw />
                    Generate
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <p className="text-xs text-muted-foreground">
                Defaults to <code>{DEFAULT_PASSWORD}</code>. Use Generate for a
                strong random password.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={createUserMutation.isPending || !canCreate}
            >
              {createUserMutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editUser)} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-4" />
              Edit email
            </DialogTitle>
            <DialogDescription>Update email for {editUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditUser(null)}
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveEmail()}
              disabled={
                updateUserMutation.isPending ||
                !editEmail.trim() ||
                editEmail === editUser?.email
              }
            >
              {updateUserMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        canResetPassword={Boolean(credentialsUserId)}
        isResetting={resetCredentialsMutation.isPending}
        onResetPassword={() => void handleResetPassword()}
      />
    </div>
  )
})
