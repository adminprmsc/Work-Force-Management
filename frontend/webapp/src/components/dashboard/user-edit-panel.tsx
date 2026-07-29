import { memo, useCallback, useMemo, useState } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

import { DataPanel } from "@/components/common/data-panel"
import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useOfficesQuery, useUpdateUserMutation, useUserQuery } from "@/hooks/api"
import {
  ROLE_LABELS,
  SM_CREATABLE_ROLES,
  USERS_PATH,
  canChangeUserRole,
  canDeleteTargetUser,
  canGrantUserAdmin,
  creatableRolesFor,
  formatOfficeOption,
  officesForRole,
  roleRequiresOffice,
} from "@/lib/user-management"
import { getQueryViewState } from "@/lib/query-view-state"
import { Role, type Role as RoleType } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"
import type { Office, User } from "@/modules/api/types"

export const UserEditPanel = memo(function UserEditPanel() {
  const { userId } = useParams<{ userId: string }>()
  const { user: actor } = useAuth()
  const userQuery = useUserQuery(userId)

  const adminActor = useMemo(
    () => ({
      role: actor?.role ?? Role.SENIOR_MANAGER_ES,
      canManageUsers: actor?.canManageUsers,
    }),
    [actor],
  )

  const user = userQuery.data

  if (userQuery.isError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={USERS_PATH}>
            <ArrowLeft className="mr-1.5 size-4" />
            Back to users
          </Link>
        </Button>
        <p className="text-sm text-destructive">
          {userQuery.error instanceof Error
            ? userQuery.error.message
            : "User not found"}
        </p>
      </div>
    )
  }

  if (user && !canDeleteTargetUser(adminActor, user.role)) {
    return <Navigate to={USERS_PATH} replace />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={USERS_PATH}>
            <ArrowLeft className="mr-1.5 size-4" />
            Back to users
          </Link>
        </Button>
      </div>

      <DataPanel
        title="Edit user"
        description={
          user
            ? `Update account details for ${user.username}`
            : "Loading account details…"
        }
        contentClassName="space-y-6"
      >
        <ShimmerContainer
          isInitialLoading={userQuery.isLoading}
          isRefreshing={userQuery.isFetching && !userQuery.isLoading}
          shimmer={<TableRowsShimmer rows={4} columns={1} />}
        >
          {user ? (
            <EditForm
              key={`${user.id}:${user.updatedAt}`}
              user={user}
              adminActor={adminActor}
            />
          ) : null}
        </ShimmerContainer>
      </DataPanel>
    </div>
  )
})

type AdminActor = {
  role: RoleType
  canManageUsers?: boolean
}

function EditForm({
  user,
  adminActor,
}: {
  user: User
  adminActor: AdminActor
}) {
  const navigate = useNavigate()
  const officesQuery = useOfficesQuery()
  const updateUserMutation = useUpdateUserMutation()
  const officesView = useMemo(
    () => getQueryViewState<Office[]>(officesQuery),
    [officesQuery],
  )

  const creatableRoles = useMemo(() => creatableRolesFor(adminActor), [adminActor])
  const allowRoleChange = canChangeUserRole(adminActor)
  const allowGrantUserAdmin = canGrantUserAdmin(adminActor)

  const [editEmail, setEditEmail] = useState(user.email)
  const [editRole, setEditRole] = useState<RoleType>(user.role)
  const [editOfficeId, setEditOfficeId] = useState(user.officeId ?? "")
  const [editCanManageUsers, setEditCanManageUsers] = useState(user.canManageUsers)

  const editAvailableOffices = useMemo(
    () => officesForRole(officesView.data ?? [], editRole),
    [editRole, officesView.data],
  )
  const editNeedsOffice = roleRequiresOffice(editRole)

  const resolvedEditOfficeId = useMemo(() => {
    if (!editNeedsOffice) return ""
    if (
      editOfficeId &&
      editAvailableOffices.some((office) => office.id === editOfficeId)
    ) {
      return editOfficeId
    }
    if (editAvailableOffices.length === 1) return editAvailableOffices[0]!.id
    return ""
  }, [editAvailableOffices, editNeedsOffice, editOfficeId])

  const roleOptions = useMemo(() => {
    if (!allowRoleChange) return creatableRoles
    const set = new Set<RoleType>([...creatableRoles, ...SM_CREATABLE_ROLES])
    set.add(user.role)
    return Array.from(set)
  }, [allowRoleChange, creatableRoles, user.role])

  const canSave = useMemo(() => {
    if (!editEmail.trim()) return false
    if (editNeedsOffice && !resolvedEditOfficeId) return false
    const emailChanged = editEmail.trim() !== user.email
    const roleChanged = allowRoleChange && editRole !== user.role
    const officeChanged =
      editNeedsOffice && resolvedEditOfficeId !== (user.officeId ?? "")
    const adminChanged =
      allowGrantUserAdmin &&
      editRole === Role.RA_ENVIRONMENT_HO &&
      editCanManageUsers !== user.canManageUsers
    return emailChanged || roleChanged || officeChanged || adminChanged
  }, [
    allowGrantUserAdmin,
    allowRoleChange,
    editCanManageUsers,
    editEmail,
    editNeedsOffice,
    editRole,
    resolvedEditOfficeId,
    user.canManageUsers,
    user.email,
    user.officeId,
    user.role,
  ])

  const handleSave = useCallback(async () => {
    if (!canSave) return

    try {
      const input: {
        email?: string
        role?: RoleType
        officeId?: string
        canManageUsers?: boolean
      } = {}

      if (editEmail.trim() !== user.email) {
        input.email = editEmail.trim()
      }
      if (allowRoleChange && editRole !== user.role) {
        input.role = editRole
      }
      if (
        editNeedsOffice &&
        (resolvedEditOfficeId !== (user.officeId ?? "") ||
          (allowRoleChange && editRole !== user.role))
      ) {
        input.officeId = resolvedEditOfficeId
      }
      if (
        allowGrantUserAdmin &&
        editRole === Role.RA_ENVIRONMENT_HO &&
        editCanManageUsers !== user.canManageUsers
      ) {
        input.canManageUsers = editCanManageUsers
      }

      await updateUserMutation.mutateAsync({
        userId: user.id,
        input,
      })
      toast.success("User updated")
      navigate(USERS_PATH)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    }
  }, [
    allowGrantUserAdmin,
    allowRoleChange,
    canSave,
    editCanManageUsers,
    editEmail,
    editNeedsOffice,
    editRole,
    navigate,
    resolvedEditOfficeId,
    updateUserMutation,
    user.canManageUsers,
    user.email,
    user.id,
    user.officeId,
    user.role,
  ])

  return (
    <div className="mx-auto grid max-w-xl gap-5">
      <div className="grid gap-2">
        <Label>Username</Label>
        <Input value={user.username} disabled />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          value={editEmail}
          onChange={(e) => setEditEmail(e.target.value)}
        />
      </div>

      {allowRoleChange ? (
        <div className="grid gap-2">
          <Label htmlFor="edit-role">Role</Label>
          <Select
            value={editRole}
            onValueChange={(value) => {
              const nextRole = value as RoleType
              setEditRole(nextRole)
              if (nextRole !== Role.RA_ENVIRONMENT_HO) {
                setEditCanManageUsers(false)
              }
              setEditOfficeId("")
            }}
          >
            <SelectTrigger id="edit-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>Role</Label>
          <Input value={ROLE_LABELS[user.role]} disabled />
        </div>
      )}

      {editNeedsOffice ? (
        <div className="grid gap-2">
          <Label htmlFor="edit-office">Office</Label>
          {editAvailableOffices.length > 0 ? (
            <Select value={resolvedEditOfficeId} onValueChange={setEditOfficeId}>
              <SelectTrigger id="edit-office" className="w-full">
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {editAvailableOffices.map((office) => (
                  <SelectItem key={office.id} value={office.id}>
                    {formatOfficeOption(office)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              No office available for this role.
            </p>
          )}
        </div>
      ) : allowRoleChange ? (
        <p className="text-sm text-muted-foreground">
          Senior Manager accounts are not tied to an office.
        </p>
      ) : null}

      {allowGrantUserAdmin && editRole === Role.RA_ENVIRONMENT_HO ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <div className="space-y-0.5">
            <Label htmlFor="edit-user-admin">User administration</Label>
            <p className="text-xs text-muted-foreground">
              Allow this RA HO user to create users, manage status, and reset
              passwords.
            </p>
          </div>
          <Switch
            id="edit-user-admin"
            checked={editCanManageUsers}
            onCheckedChange={setEditCanManageUsers}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button
          variant="outline"
          asChild
          disabled={updateUserMutation.isPending}
        >
          <Link to={USERS_PATH}>Cancel</Link>
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={updateUserMutation.isPending || !canSave}
        >
          <Save className="mr-2 size-4" />
          {updateUserMutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  )
}
