import { Link, Navigate } from "react-router-dom"
import { BarChart3, ChevronRight } from "lucide-react"

import {
  ShimmerContainer,
  TableRowsShimmer,
} from "@/components/common/query-shimmer"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSurveyFormsQuery } from "@/hooks/api/survey-hooks"
import { getQueryViewState } from "@/lib/query-view-state"
import {
  canViewSurveyAnalytics,
  statusBadgeVariant,
  statusLabel,
  surveyFormDashboardPath,
} from "@/lib/survey"
import type { SurveyForm } from "@/modules/api/survey-types"
import { useAuth } from "@/modules/auth/use-auth"

export function FormDashboardsIndexPage() {
  const auth = useAuth()
  const query = useSurveyFormsQuery()
  const view = getQueryViewState<SurveyForm[]>(query)

  if (auth.status !== "authenticated" || !canViewSurveyAnalytics(auth.user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  const forms = (view.data ?? []).filter(
    (form) => form.status === "PUBLISHED" || form.status === "ARCHIVED",
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40 text-primary">
            <BarChart3 className="size-6" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Form dashboards
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Response analytics by form
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Dedicated dashboards for each published survey — demographics,
              procurement linkage, and question-level insights from submitted
              responses.
            </p>
          </div>
        </div>
      </div>

      <ShimmerContainer
        isInitialLoading={view.isInitialLoading}
        isRefreshing={view.isRefreshing}
        shimmer={<TableRowsShimmer rows={4} columns={3} />}
      >
        {forms.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No published forms yet. Publish a survey form to open its dashboard.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {forms.map((form) => (
              <Link
                key={form.id}
                to={surveyFormDashboardPath(auth.user.role, form.id)}
                className="group"
              >
                <Card className="h-full border-border/80 transition hover:border-primary/30 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base leading-snug">
                        {form.title}
                      </CardTitle>
                      <Badge variant={statusBadgeVariant(form.status)}>
                        {statusLabel(form.status)}
                      </Badge>
                    </div>
                    {form.description ? (
                      <CardDescription className="line-clamp-2">
                        {form.description}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                  <CardContent className="flex items-center justify-between text-sm text-primary">
                    <span>Open dashboard</span>
                    <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </ShimmerContainer>
    </div>
  )
}
