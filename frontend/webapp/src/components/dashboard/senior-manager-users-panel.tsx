import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Mail, Pencil, Plus, Power, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
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
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useOfficesQuery,
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
import { getQueryViewState, mergeQueryViewStates } from "@/lib/query-view-state"

type UserTableRowProps = {
  user: User
  onEditEmail: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
  isTogglingStatus: boolean
  isDeleting: boolean
}

const UserTableRow = memo(function UserTableRow({
  user,
  onEditEmail,
  onToggleStatus,
  onDelete,
  isTogglingStatus,
  isDeleting,
}: UserTableRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{user.username}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>
        <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={user.status === "ACTIVE" ? "default" : "outline"}>{user.status}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{user.officeName ?? "—"}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
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

  const usersView = useMemo(() => getQueryViewState<User[]>(usersQuery), [usersQuery])
  const officesView = useMemo(() => getQueryViewState<Office[]>(officesQuery), [officesQuery])
  const viewState = useMemo(
    () => mergeQueryViewStates([usersView, officesView]),
    [officesView, usersView],
  )

  const users = usersView.data

  const [createOpen, setCreateOpen] = useState(false)
  const [createRole, setCreateRole] = useState<RoleType>(Role.RA_ENVIRONMENT_HO)
  const [createOfficeId, setCreateOfficeId] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createUsername, setCreateUsername] = useState("")
  const [createPassword, setCreatePassword] = useState("")

  const [editUser, setEditUser] = useState<User | null>(null)
  const [editEmail, setEditEmail] = useState("")

  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const availableOffices = useMemo(
    () => officesForRole(officesView.data ?? [], createRole),
    [createRole, officesView.data],
  )

  const needsOffice = roleRequiresOffice(createRole)

  useEffect(() => {
    if (!needsOffice) {
      setCreateOfficeId("")
      return
    }
    if (availableOffices.length === 1) {
      setCreateOfficeId(availableOffices[0].id)
      return
    }
    if (!availableOffices.some((office) => office.id === createOfficeId)) {
      setCreateOfficeId("")
    }
  }, [availableOffices, createOfficeId, createRole, needsOffice])

  const canCreate = useMemo(() => {
    if (!createEmail.trim() || !createUsername.trim() || createPassword.length < 8) {
      return false
    }
    if (needsOffice && !createOfficeId) {
      return false
    }
    return true
  }, [createEmail, createOfficeId, createPassword, createUsername, needsOffice])

  const handleEditEmail = useCallback((user: User) => {
    setEditUser(user)
    setEditEmail(user.email)
  }, [])

  const resetCreateForm = useCallback(() => {
    setCreateRole(Role.RA_ENVIRONMENT_HO)
    setCreateOfficeId("")
    setCreateEmail("")
    setCreateUsername("")
    setCreatePassword("")
  }, [])

  const handleCreate = useCallback(async () => {
    if (!canCreate) return

    try {
      await createUserMutation.mutateAsync({
        email: createEmail.trim(),
        username: createUsername.trim(),
        password: createPassword,
        role: createRole,
        officeId: needsOffice ? createOfficeId : undefined,
      })
      toast.success(`${ROLE_LABELS[createRole]} user created`)
      setCreateOpen(false)
      resetCreateForm()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create user")
    }
  }, [
    canCreate,
    createEmail,
    createOfficeId,
    createPassword,
    createRole,
    createUserMutation,
    createUsername,
    needsOffice,
    resetCreateForm,
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>User accounts</CardTitle>
            <CardDescription>
              Create users for any role, assign offices dynamically, and manage account status
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create user
          </Button>
        </CardHeader>
        <CardContent>
          {viewState.error ? (
            <p className="text-sm text-destructive">{viewState.error}</p>
          ) : (
            <ShimmerContainer
              isInitialLoading={viewState.isInitialLoading}
              isRefreshing={viewState.isRefreshing}
              shimmer={<TableRowsShimmer rows={6} columns={6} />}
            >
              <Table className="enterprise-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((user) => (
                    <UserTableRow
                      key={user.id}
                      user={user}
                      onEditEmail={handleEditEmail}
                      onToggleStatus={(selected) => void handleToggleStatus(selected)}
                      onDelete={setDeleteUser}
                      isTogglingStatus={updateUserStatusMutation.isPending}
                      isDeleting={deleteUserMutation.isPending}
                    />
                  ))}
                </TableBody>
              </Table>
            </ShimmerContainer>
          )}
        </CardContent>
      </Card>

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
                onValueChange={(value) => setCreateRole(value as RoleType)}
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
                  <Select value={createOfficeId} onValueChange={setCreateOfficeId}>
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
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="user@example.com"
              />
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
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
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
    </>
  )
})
