import { useCallback, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format } from "date-fns"
import { MapPin, X } from "lucide-react"

import { DataPanel } from "@/components/common/data-panel"
import { ListPagination } from "@/components/common/list-pagination"
import {
  DEFAULT_PAGE_SIZE,
  type PageSizeOption,
} from "@/lib/list-pagination"
import {
  ShimmerContainer,
  TableRowsShimmer,
} from "@/components/common/query-shimmer"
import { SurveyResponsesMap } from "@/components/survey/survey-responses-map"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useSurveyFormsQuery,
  useSurveyResponsesQuery,
} from "@/hooks/api/survey-hooks"
import { getQueryViewState } from "@/lib/query-view-state"
import {
  responseStatusBadgeVariant,
  responseStatusLabel,
  surveyResponsePath,
} from "@/lib/survey"
import { useAuth } from "@/modules/auth/use-auth"
import type {
  SurveyResponse,
  SurveyResponsesListResponse,
} from "@/modules/api/survey-types"

function siteLabel(response: SurveyResponse): string {
  return response.settlement
    ? `${response.village.name} · ${response.settlement.name}`
    : response.village.name
}

export function SurveyResponsesPanel() {
  const { user } = useAuth()
  const [formFilter, setFormFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)
  const [mapResponse, setMapResponse] = useState<SurveyResponse | null>(null)
  const formsQuery = useSurveyFormsQuery()
  const query = useSurveyResponsesQuery({
    ...(formFilter ? { formId: formFilter } : {}),
    ...(statusFilter
      ? { status: statusFilter as SurveyResponse["status"] }
      : {}),
    page,
    limit: pageSize,
  })
  const view = getQueryViewState<SurveyResponsesListResponse>(query)

  const responses = useMemo(() => {
    const items = view.data?.items ?? []
    if (statusFilter) return items
    return items.filter((response) => response.status !== "DRAFT")
  }, [view.data?.items, statusFilter])

  const total = view.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (page > totalPages) {
    setPage(totalPages)
  }

  const forms = useMemo(() => formsQuery.data ?? [], [formsQuery.data])

  const handlePageSizeChange = useCallback((next: PageSizeOption) => {
    setPageSize(next)
    setPage(1)
  }, [])

  const toggleMapResponse = (response: SurveyResponse) => {
    if (!response.submittedLocation) return
    setMapResponse((current) =>
      current?.id === response.id ? null : response,
    )
  }

  const filterControl = useMemo(
    () => (
      <div className="flex flex-col gap-2 sm:flex-row">
        <NativeSelect
          className="w-full sm:w-64"
          value={formFilter}
          onChange={(e) => {
            setFormFilter(e.target.value)
            setPage(1)
          }}
        >
          <NativeSelectOption value="">All forms</NativeSelectOption>
          {forms.map((form) => (
            <NativeSelectOption key={form.id} value={form.id}>
              {form.title}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          className="w-full sm:w-48"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setPage(1)
          }}
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          <NativeSelectOption value="SUBMITTED">Pending review</NativeSelectOption>
          <NativeSelectOption value="ACCEPTED">Accepted</NativeSelectOption>
          <NativeSelectOption value="REVERTED">Reverted</NativeSelectOption>
          <NativeSelectOption value="REJECTED">Rejected</NativeSelectOption>
        </NativeSelect>
      </div>
    ),
    [formFilter, statusFilter, forms],
  )

  return (
    <div className="space-y-6">
      <DataPanel
        title="Survey responses"
        description="Site-visit submissions collected by tehsil RAs. Select a GPS tag in the table to view the submission on the map."
        action={filterControl}
      >
        <Collapsible open={Boolean(mapResponse?.submittedLocation)}>
          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
            {mapResponse?.submittedLocation ? (
              <div className="mb-6 rounded-xl border bg-muted/20 p-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Submission location</p>
                    <p className="text-sm text-muted-foreground">
                      {mapResponse.form.title} · {siteLabel(mapResponse)} ·{" "}
                      {mapResponse.tehsil.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {mapResponse.submittedLocation.latitude.toFixed(6)},{" "}
                      {mapResponse.submittedLocation.longitude.toFixed(6)}
                      {mapResponse.submittedLocation.accuracyMeters != null
                        ? ` · ±${Math.round(mapResponse.submittedLocation.accuracyMeters)} m`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapResponse(null)}
                  >
                    <X className="size-4" />
                    Close map
                  </Button>
                </div>
                <SurveyResponsesMap
                  responses={[mapResponse]}
                  focusResponseId={mapResponse.id}
                />
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>

        {view.error ? (
          <p className="text-sm text-destructive">{view.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={view.isInitialLoading}
            isRefreshing={view.isRefreshing}
            shimmer={<TableRowsShimmer rows={6} columns={6} />}
          >
            <Table className="enterprise-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Tehsil</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Respondent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.length ? (
                  responses.map((response) => {
                    const isMapSelected = mapResponse?.id === response.id

                    return (
                      <TableRow
                        key={response.id}
                        className={isMapSelected ? "bg-muted/40" : undefined}
                      >
                        <TableCell className="font-medium">
                          {response.form.title}
                        </TableCell>
                        <TableCell>{response.tehsil.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {siteLabel(response)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {response.respondent.username}
                        </TableCell>
                        <TableCell>
                          <Badge variant={responseStatusBadgeVariant(response.status)}>
                            {response.status === "SUBMITTED" &&
                            response.submittedAt
                              ? `${responseStatusLabel(response.status)} · ${format(
                                  new Date(response.submittedAt),
                                  "dd MMM",
                                )}`
                              : responseStatusLabel(response.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {response.submittedLocation ? (
                            <Button
                              variant={isMapSelected ? "secondary" : "ghost"}
                              size="sm"
                              className="h-8 gap-1.5 px-2"
                              onClick={() => toggleMapResponse(response)}
                            >
                              <MapPin className="size-3.5" />
                              {isMapSelected ? "On map" : "Show on map"}
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {user ? (
                            <Button variant="ghost" size="sm" asChild>
                              <Link
                                to={surveyResponsePath(user.role, response.id)}
                              >
                                View
                              </Link>
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No responses yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ShimmerContainer>
        )}
        <ListPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          label="responses"
        />
      </DataPanel>
    </div>
  )
}
