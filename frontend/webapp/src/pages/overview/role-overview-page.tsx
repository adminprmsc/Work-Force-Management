import { Link } from "react-router-dom"
import { ArrowRight, ClipboardList, Inbox, MapPinned, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { canManageProcurement } from "@/lib/procurement-access"
import {
  canFillSurveys,
  canManageSurveys,
  canReadSurveyResponses,
  surveyFormsPath,
  surveyResponsesPath,
} from "@/lib/survey"
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

type OverviewFeature = {
  key: string
  icon: typeof Package
  title: string
  description: string
  path: string
  cta: string
  accent: string
  buttonVariant: "default" | "outline"
}

export function RoleOverviewPage() {
  const auth = useAuth()
  if (auth.status !== "authenticated") return null

  const { user } = auth
  const canManage = canManageProcurement(user.role)
  const roleLabel = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role

  const features: OverviewFeature[] = [
    {
      key: "procurement",
      icon: Package,
      title: "Procurement",
      description: canManage
        ? "Manage packages, contractors, and consultants across tehsils."
        : "View procurement packages aligned with your access level.",
      path: getProcurementPackagesPath(user.role),
      cta: "Open procurement",
      accent: "bg-primary/10 text-primary",
      buttonVariant: "default",
    },
    {
      key: "geography",
      icon: MapPinned,
      title: "Geography",
      description: "Browse tehsils, villages, and settlements.",
      path: getGeographyPath(user.role),
      cta: "Open geography",
      accent: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
      buttonVariant: "outline",
    },
  ]

  if (canManageSurveys(user.role)) {
    features.push({
      key: "survey-forms",
      icon: ClipboardList,
      title: "Survey forms",
      description:
        "Design site-visit questionnaires and assign them to procurement packages with a submission schedule.",
      path: surveyFormsPath(user.role),
      cta: "Open survey forms",
      accent: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
      buttonVariant: "outline",
    })
  }

  if (canFillSurveys(user.role)) {
    features.push({
      key: "my-surveys",
      icon: ClipboardList,
      title: "My surveys",
      description:
        "Forms assigned to your tehsil — start a site visit submission or continue a draft.",
      path: surveyFormsPath(user.role),
      cta: "Open my surveys",
      accent: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
      buttonVariant: "default",
    })
  }

  if (canReadSurveyResponses(user.role) && !canFillSurveys(user.role)) {
    features.push({
      key: "survey-responses",
      icon: Inbox,
      title: "Survey responses",
      description: "Review site-visit submissions collected by tehsil RAs.",
      path: surveyResponsesPath(user.role),
      cta: "View responses",
      accent: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
      buttonVariant: "outline",
    })
  }

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
                    <CardDescription>{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pl-6">
                <Button asChild variant={feature.buttonVariant}>
                  <Link to={feature.path}>
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
