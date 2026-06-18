import { memo } from "react"
import { Building2, Mail, User } from "lucide-react"

import { ProfileCardShimmer } from "@/components/common/query-shimmer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROLE_LABELS } from "@/lib/user-management"
import { useAuth } from "@/modules/auth/use-auth"

export const ProfileCard = memo(function ProfileCard() {
  const auth = useAuth()

  if (auth.status === "loading") {
    return (
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <ProfileCardShimmer />
        </CardHeader>
      </Card>
    )
  }

  if (auth.status !== "authenticated") return null

  const { user } = auth
  const roleLabel = ROLE_LABELS[user.role] ?? user.role

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <CardTitle className="text-base font-semibold tracking-tight">Your profile</CardTitle>
        <CardDescription>Authenticated session details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <User className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">{user.username}</p>
            <p className="text-sm text-muted-foreground">{roleLabel}</p>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-muted-foreground" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <Badge variant="secondary">{roleLabel}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
