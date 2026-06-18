import { Link } from "react-router-dom"
import { ArrowRight, MapPinned, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canManageProcurement } from "@/lib/procurement-access"
import { ROLE_LABELS } from "@/lib/user-management"
import { Role, roleToDashboardPath } from "@/modules/auth/roles"
import { useAuth } from "@/modules/auth/use-auth"

function getProcurementPackagesPath(role: string): string {
  const base = roleToDashboardPath(role as (typeof Role)[keyof typeof Role])
  return `${base}/procurement/packages`
}

function getGeographyPath(role: string): string {
  const base = roleToDashboardPath(role as (typeof Role)[keyof typeof Role])
  return `${base}/geography`
}

const features = [
  {
    key: "procurement",
    icon: Package,
    title: "Procurement",
    manageDescription:
      "Manage packages, contractors, and consultants across tehsils.",
    readDescription:
      "View procurement packages aligned with your access level.",
    path: (role: string) => getProcurementPackagesPath(role),
    cta: "Open procurement",
    accent: "bg-primary/10 text-primary",
    buttonVariant: "default" as const,
  },
  {
    key: "geography",
    icon: MapPinned,
    title: "Geography",
    manageDescription: "Browse tehsils, villages, and settlements.",
    readDescription: "Browse tehsils, villages, and settlements.",
    path: (role: string) => getGeographyPath(role),
    cta: "Open geography",
    accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    buttonVariant: "outline" as const,
  },
] as const

export function RoleOverviewPage() {
  const auth = useAuth()
  if (auth.status !== "authenticated") return null

  const { user } = auth
  const canManage = canManageProcurement(user.role)
  const roleLabel = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/80 bg-card px-5 py-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Welcome back
        </p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{user.username}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{roleLabel}</span>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon
          const description =
            feature.key === "procurement"
              ? canManage
                ? feature.manageDescription
                : feature.readDescription
              : feature.readDescription

          return (
            <Card key={feature.key} className="feature-card shadow-sm">
              <CardHeader className="pl-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${feature.accent}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base font-semibold">{feature.title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-6">
                <Button asChild variant={feature.buttonVariant}>
                  <Link to={feature.path(user.role)}>
                    {feature.cta}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
