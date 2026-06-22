import { useMemo, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/modules/auth/use-auth"
import { roleToDashboardPath } from "@/modules/auth/roles"

export function ChangePasswordPage() {
  const auth = useAuth()
  const navigate = useNavigate()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(
    () =>
      currentPassword.length > 0 &&
      newPassword.length >= 8 &&
      confirmPassword.length >= 8 &&
      newPassword === confirmPassword,
    [confirmPassword, currentPassword.length, newPassword],
  )

  if (auth.status === "loading") {
    return null
  }

  if (auth.status !== "authenticated") {
    return <Navigate to="/login" replace />
  }

  if (!auth.user.mustChangePassword) {
    return <Navigate to={roleToDashboardPath(auth.user.role)} replace />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from your current password")
      return
    }

    setSubmitting(true)
    try {
      await auth.changePassword({ currentPassword, newPassword })
      navigate(roleToDashboardPath(auth.user!.role), { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change password"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-gradient-to-br from-slate-50 via-background to-slate-100 p-6">
      <Card className="w-full max-w-md border-border/70 shadow-xl shadow-slate-200/60">
        <CardHeader className="space-y-1.5 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <KeyRound className="size-5" />
            Change your password
          </CardTitle>
          <CardDescription>
            Your password was reset by an administrator. Choose a new password before
            continuing.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Current password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">At least 8 characters.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11"
              />
            </div>

            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button
              className="h-11 w-full text-sm font-semibold"
              type="submit"
              disabled={!canSubmit || submitting}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
