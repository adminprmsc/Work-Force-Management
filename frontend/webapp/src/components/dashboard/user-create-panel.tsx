import { memo, useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, RefreshCw, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { DataPanel } from "@/components/common/data-panel"
import {
  UserCredentialsDialog,
  type UserCredentials,
} from "@/components/dashboard/user-credentials-dialog"
import { Button } from "@/components/ui/button"
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
import { useCreateUserMutation, useOfficesQuery } from "@/hooks/api"
import {
  ROLE_LABELS,
  USERS_PATH,
  creatableRolesFor,
  formatOfficeOption,
  officesForRole,
  roleRequiresOffice,
} from "@/lib/user-management"
import { getQueryViewState } from "@/lib/query-view-state"
import { Role, type Role as RoleType } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"
import type { Office } from "@/modules/api/types"

const EMAIL_DOMAIN = "ens.com"
const DEFAULT_PASSWORD = "Root123!"

function sanitizeEmailLocalPart(value: string): string {
  return value.split("@")[0].replace(/\s/g, "")
}

function randomChar(set: string): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return set[buf[0] % set.length]
}

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

export const UserCreatePanel = memo(function UserCreatePanel() {
  const navigate = useNavigate()
  const { user: actor } = useAuth()
  const officesQuery = useOfficesQuery()
  const createUserMutation = useCreateUserMutation()
  const officesView = useMemo(
    () => getQueryViewState<Office[]>(officesQuery),
    [officesQuery],
  )

  const adminActor = useMemo(
    () => ({
      role: actor?.role ?? Role.SENIOR_MANAGER_ES,
      canManageUsers: actor?.canManageUsers,
    }),
    [actor],
  )
  const creatableRoles = useMemo(() => creatableRolesFor(adminActor), [adminActor])

  const [createRole, setCreateRole] = useState<RoleType>(
    () => creatableRoles[0] ?? Role.RA_ENVIRONMENT_HO,
  )
  const [createOfficeId, setCreateOfficeId] = useState("")
  const [createEmail, setCreateEmail] = useState("")
  const [createUsername, setCreateUsername] = useState("")
  const [createPassword, setCreatePassword] = useState(DEFAULT_PASSWORD)
  const [showPassword, setShowPassword] = useState(false)

  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [credentials, setCredentials] = useState<UserCredentials | null>(null)

  const availableOffices = useMemo(
    () => officesForRole(officesView.data ?? [], createRole),
    [createRole, officesView.data],
  )
  const needsOffice = roleRequiresOffice(createRole)

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
    if (needsOffice && !resolvedCreateOfficeId) return false
    return true
  }, [createEmail, createPassword, createUsername, needsOffice, resolvedCreateOfficeId])

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
    resolvedCreateOfficeId,
  ])

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
        title="Create user"
        description="Choose a role and assign the matching office when required."
        contentClassName="space-y-6"
      >
        <div className="mx-auto grid max-w-xl gap-5">
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
                {creatableRoles.map((role) => (
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

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" asChild disabled={createUserMutation.isPending}>
              <Link to={USERS_PATH}>Cancel</Link>
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={createUserMutation.isPending || !canCreate}
            >
              <UserPlus className="mr-2 size-4" />
              {createUserMutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </div>
      </DataPanel>

      <UserCredentialsDialog
        open={credentialsOpen}
        onOpenChange={(open) => {
          setCredentialsOpen(open)
          if (!open) navigate(USERS_PATH)
        }}
        credentials={credentials}
        title="New user credentials"
        canResetPassword={false}
        isResetting={false}
        onResetPassword={() => undefined}
      />
    </div>
  )
})
