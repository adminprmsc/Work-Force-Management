import { Link, Navigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, BarChart3, RefreshCw } from "lucide-react"

import { FormAnalyticsDashboard } from "@/components/survey/form-analytics-dashboard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useSurveyFormAnalyticsQuery } from "@/hooks/api/survey-hooks"
import { useAuth } from "@/modules/auth/use-auth"
import { getQueryViewState } from "@/lib/query-view-state"
import {
  readAnalyticsDateFilter,
  readAnalyticsDatePreset,
  type AnalyticsDatePreset,
} from "@/lib/survey-analytics-dates"
import {
  canViewSurveyAnalytics,
  statusBadgeVariant,
  statusLabel,
  surveyFormDashboardsPath,
  surveyResponsesPath,
} from "@/lib/survey"
import type { SurveyFormAnalytics } from "@/modules/api/survey-types"
import { cn } from "@/lib/utils"

export function FormDashboardPage() {
  const { formId } = useParams<{ formId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const auth = useAuth()

  const selectedPackageId = searchParams.get("packageId")
  const datePreset = readAnalyticsDatePreset(searchParams)
  const { submittedFrom, submittedTo } = readAnalyticsDateFilter(searchParams)

  const query = useSurveyFormAnalyticsQuery(formId ?? null, {
    procurementPackageId: selectedPackageId,
    submittedFrom,
    submittedTo,
  })
  const view = getQueryViewState<SurveyFormAnalytics>(query)

  if (auth.status !== "authenticated" || !canViewSurveyAnalytics(auth.user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!formId) {
    return <Navigate to={surveyFormDashboardsPath(auth.user.role)} replace />
  }

  const analytics = view.data

  const handlePackageChange = (packageId: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (packageId) {
      next.set("packageId", packageId)
    } else {
      next.delete("packageId")
    }
    setSearchParams(next, { replace: true })
  }

  const handleDatePresetChange = (preset: AnalyticsDatePreset) => {
    const next = new URLSearchParams(searchParams)
    next.set("datePreset", preset)
    if (preset === "custom") {
      if (!next.get("submittedFrom")) next.delete("submittedFrom")
      if (!next.get("submittedTo")) next.delete("submittedTo")
    } else {
      next.delete("submittedFrom")
      next.delete("submittedTo")
    }
    setSearchParams(next, { replace: true })
  }

  const handleCustomDateChange = (from: string | null, to: string | null) => {
    const next = new URLSearchParams(searchParams)
    next.set("datePreset", "custom")
    if (from) {
      next.set("submittedFrom", from)
    } else {
      next.delete("submittedFrom")
    }
    if (to) {
      next.set("submittedTo", to)
    } else {
      next.delete("submittedTo")
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              to={surveyFormDashboardsPath(auth.user.role)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              All form dashboards
            </Link>
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                <BarChart3 className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {analytics?.form.title ?? "Form dashboard"}
                  </h2>
                  {analytics ? (
                    <Badge variant={statusBadgeVariant(analytics.form.status)}>
                      {statusLabel(analytics.form.status)}
                    </Badge>
                  ) : null}
                  {analytics?.filter.procurementPackageName ? (
                    <Badge variant="outline">{analytics.filter.procurementPackageName}</Badge>
                  ) : null}
                </div>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  {analytics?.form.description ??
                    "Stakeholder dashboard for submitted site-visit responses. Choose a procurement package and submission date window to see demographics and compliance patterns for that scope."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => query.refetch()}
              disabled={view.isRefreshing}
            >
              <RefreshCw
                className={cn("mr-2 size-4", view.isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to={`${surveyResponsesPath(auth.user.role)}?formId=${formId}`}>
                View raw responses
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {view.error ? (
        <p className="text-sm text-destructive">{view.error}</p>
      ) : (
        <FormAnalyticsDashboard
          analytics={analytics}
          selectedPackageId={selectedPackageId}
          onPackageChange={handlePackageChange}
          datePreset={datePreset}
          submittedFrom={submittedFrom}
          submittedTo={submittedTo}
          onDatePresetChange={handleDatePresetChange}
          onCustomDateChange={handleCustomDateChange}
          isInitialLoading={view.isInitialLoading}
          isRefreshing={view.isRefreshing}
        />
      )}
    </div>
  )
}
