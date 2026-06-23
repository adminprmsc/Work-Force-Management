import { useCallback, useState } from "react"
import { Copy, Eye, EyeOff, KeyRound } from "lucide-react"
import { toast } from "sonner"

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
import { Label } from "@/components/ui/label"
import { copyTextToClipboard } from "@/lib/copy-to-clipboard"

export type UserCredentials = {
  username: string
  email: string
  password: string | null
}

type UserCredentialsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  credentials: UserCredentials | null
  canResetPassword?: boolean
  isResetting?: boolean
  onResetPassword?: () => void
  title?: string
  description?: string
}

async function copyToClipboard(text: string, label: string) {
  try {
    await copyTextToClipboard(text)
    toast.success(`${label} copied`)
  } catch {
    toast.error(`Failed to copy ${label}`)
  }
}

function formatShareText(credentials: UserCredentials): string {
  const lines = [
    `Email: ${credentials.email}`,
    `Username: ${credentials.username}`,
  ]
  if (credentials.password) {
    lines.push(`Password: ${credentials.password}`)
  }
  return lines.join("\n")
}

export function UserCredentialsDialog({
  open,
  onOpenChange,
  credentials,
  canResetPassword = false,
  isResetting = false,
  onResetPassword,
  title = "User credentials",
  description,
}: UserCredentialsDialogProps) {
  const [showPassword, setShowPassword] = useState(true)

  const handleCopyAll = useCallback(async () => {
    if (!credentials) return
    if (!credentials.password) {
      toast.error("Generate a password first before copying credentials")
      return
    }
    await copyToClipboard(formatShareText(credentials), "Credentials")
  }, [credentials])

  const defaultDescription = credentials?.password
    ? "Share these login details with the user. They will be asked to set a new password on next sign-in."
    : "Email can be copied anytime. Passwords are not stored — reset to generate a new one."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            {title}
          </DialogTitle>
          <DialogDescription>{description ?? defaultDescription}</DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="cred-email">Email</Label>
              <div className="flex gap-2">
                <Input id="cred-email" readOnly value={credentials.email} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Copy email"
                  onClick={() => void copyToClipboard(credentials.email, "Email")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="cred-username">Username</Label>
              <div className="flex gap-2">
                <Input id="cred-username" readOnly value={credentials.username} />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Copy username"
                  onClick={() => void copyToClipboard(credentials.username, "Username")}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>

            {credentials.password ? (
              <div className="grid gap-1.5">
                <Label htmlFor="cred-password">Password</Label>
                <div className="flex gap-2">
                  <Input
                    id="cred-password"
                    readOnly
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Copy password"
                    onClick={() =>
                      void copyToClipboard(credentials.password!, "Password")
                    }
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                The current password cannot be retrieved. Generate a new temporary password
                to share with this user.
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            {canResetPassword && onResetPassword ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isResetting}
                onClick={onResetPassword}
              >
                {isResetting ? "Generating…" : "Reset password"}
              </Button>
            ) : null}
            {credentials?.password ? (
              <Button type="button" variant="outline" onClick={() => void handleCopyAll()}>
                <Copy className="mr-2 size-4" />
                Copy all
              </Button>
            ) : null}
          </div>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
