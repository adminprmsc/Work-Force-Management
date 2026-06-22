import { useMemo, useState } from "react"
import { format } from "date-fns"

import { DataPanel } from "@/components/common/data-panel"
import {
  ShimmerContainer,
  TableRowsShimmer,
} from "@/components/common/query-shimmer"
import { SurveyResponseDetail } from "@/components/survey/survey-response-detail"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import type { SurveyResponse } from "@/modules/api/survey-types"

export function SurveyResponsesPanel() {
  const [formFilter, setFormFilter] = useState("")
  const formsQuery = useSurveyFormsQuery()
  const query = useSurveyResponsesQuery(
    formFilter ? { formId: formFilter } : {},
  )
  const view = getQueryViewState<SurveyResponse[]>(query)
  const responses = view.data ?? []

  const forms = useMemo(() => formsQuery.data ?? [], [formsQuery.data])
  const [detail, setDetail] = useState<SurveyResponse | null>(null)

  const filterControl = useMemo(
    () => (
      <NativeSelect
        className="w-full sm:w-64"
        value={formFilter}
        onChange={(e) => setFormFilter(e.target.value)}
      >
        <NativeSelectOption value="">All forms</NativeSelectOption>
        {forms.map((form) => (
          <NativeSelectOption key={form.id} value={form.id}>
            {form.title}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    ),
    [formFilter, forms],
  )

  return (
    <>
      <DataPanel
        title="Survey responses"
        description="Site-visit submissions collected by tehsil RAs."
        action={filterControl}
      >
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
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.length ? (
                  responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell className="font-medium">
                        {response.form.title}
                      </TableCell>
                      <TableCell>{response.tehsil.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {response.village.name}
                        {response.settlement ? ` · ${response.settlement.name}` : ""}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {response.respondent.username}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            response.status === "SUBMITTED" ? "default" : "secondary"
                          }
                        >
                          {response.status === "SUBMITTED"
                            ? `Submitted ${format(
                                new Date(response.submittedAt ?? response.updatedAt),
                                "dd MMM",
                              )}`
                            : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetail(response)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No responses yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ShimmerContainer>
        )}
      </DataPanel>

      <SurveyResponseDetail
        open={Boolean(detail)}
        onOpenChange={(open) => !open && setDetail(null)}
        response={detail}
      />
    </>
  )
}
