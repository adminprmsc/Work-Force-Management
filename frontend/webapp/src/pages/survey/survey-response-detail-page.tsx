import { Link, Navigate, useParams } from "react-router-dom"
import { ArrowLeft, FileText, RefreshCw } from "lucide-react"

import { SurveyResponseDetail } from "@/components/survey/survey-response-detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ShimmerContainer,
  TableRowsShimmer,
} from "@/components/common/query-shimmer"
import { useSurveyResponseQuery } from "@/hooks/api/survey-hooks"
import { getQueryViewState } from "@/lib/query-view-state"
import {
  canReadSurveyResponses,
  responseStatusBadgeVariant,
  responseStatusLabel,
  surveyResponsesPath,
} from "@/lib/survey"
import { cn } from "@/lib/utils"
import { useAuth } from "@/modules/auth/use-auth"
import type { SurveyResponse } from "@/modules/api/survey-types"

function siteLabel(response: SurveyResponse): string {
  return response.settlement
    ? `${response.village.name} · ${response.settlement.name}`
    : response.village.name
}

export function SurveyResponseDetailPage() {
  const { responseId } = useParams<{ responseId: string }>()
  const auth = useAuth()
  const query = useSurveyResponseQuery(responseId ?? null)
  const view = getQueryViewState<SurveyResponse>(query)

  if (auth.status !== "authenticated" || !canReadSurveyResponses(auth.user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (!responseId) {
    return <Navigate to={surveyResponsesPath(auth.user.role)} replace />
  }

  const response = view.data
  const listPath = surveyResponsesPath(auth.user.role)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              to={listPath}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              All responses
            </Link>
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                <FileText className="size-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {response?.form.title ?? "Response details"}
                  </h2>
                  {response ? (
                    <Badge variant={responseStatusBadgeVariant(response.status)}>
                      {responseStatusLabel(response.status)}
                    </Badge>
                  ) : null}
                </div>
                {response ? (
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    {response.tehsil.name} · {siteLabel(response)} · by{" "}
                    {response.respondent.username}
                  </p>
                ) : (
                  <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                    Loading submission details…
                  </p>
                )}
              </div>
            </div>
          </div>

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
        </div>
      </div>

      {view.error ? (
        <p className="text-sm text-destructive">{view.error}</p>
      ) : (
        <ShimmerContainer
          isInitialLoading={view.isInitialLoading}
          isRefreshing={false}
          shimmer={<TableRowsShimmer rows={8} columns={2} />}
        >
          {response ? <SurveyResponseDetail response={response} /> : null}
        </ShimmerContainer>
      )}
    </div>
  )
}
