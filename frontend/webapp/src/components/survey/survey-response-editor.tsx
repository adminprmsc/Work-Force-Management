import { useMemo, useState } from "react"
import { toast } from "sonner"

import { SurveyFieldControl } from "@/components/survey/survey-field-control"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { useProcurementPackageQuery } from "@/hooks/api/procurement-hooks"
import {
  useSaveSurveyResponseMutation,
  useStartSurveyResponseMutation,
  useSubmitSurveyResponseMutation,
} from "@/hooks/api/survey-hooks"
import { useSettlementsQuery } from "@/hooks/api/tehsils-hooks"
import { fieldIsPresentational, responseIsEditable } from "@/lib/survey"
import { getSubmissionLocation, GeolocationError } from "@/lib/geolocation"
import {
  buildPackageFieldAnswers,
  fieldIsPackageBound,
} from "@/lib/package-field-reference"
import { visibleAnswerableFields } from "@/lib/survey-answers"
import { resolveVisibleFieldIds, sectionToggleKey } from "@/lib/survey-field-visibility"
import type {
  SurveyAnswer,
  SurveyAssignment,
  SurveyField,
  SurveyResponse,
} from "@/modules/api/survey-types"

type AnswerMap = Record<string, unknown>

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    return Object.values(obj).every((v) => v === undefined || v === "")
  }
  return false
}

function buildAnswers(fields: SurveyField[], answers: AnswerMap): SurveyAnswer[] {
  const fieldAnswers = visibleAnswerableFields(fields, answers)
    .filter((field) => !isEmpty(answers[field.id]))
    .map((field) => ({ fieldId: field.id, value: answers[field.id] }))

  // Include section toggle answers so backend can resolve visibility
  const togglePrefix = "__section_toggle__"
  for (const [key, value] of Object.entries(answers)) {
    if (key.startsWith(togglePrefix) && value) {
      fieldAnswers.push({ fieldId: key, value })
    }
  }

  return fieldAnswers
}

type SurveyResponseEditorProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  assignment: SurveyAssignment | null
  response: SurveyResponse | null
}

export function SurveyResponseEditor({
  open,
  onOpenChange,
  assignment,
  response,
}: SurveyResponseEditorProps) {
  const startMutation = useStartSurveyResponseMutation()
  const saveMutation = useSaveSurveyResponseMutation()
  const submitMutation = useSubmitSurveyResponseMutation()

  const [responseId, setResponseId] = useState<string | null>(
    response?.id ?? null,
  )
  const [activeResponse, setActiveResponse] = useState<SurveyResponse | null>(
    response,
  )
  const [visitStarted, setVisitStarted] = useState(Boolean(response?.id))
  const [villageId, setVillageId] = useState("")
  const [settlementId, setSettlementId] = useState("")
  const [answers, setAnswers] = useState<AnswerMap>(() => {
    const initial: AnswerMap = {}
    for (const answer of response?.answers ?? []) {
      initial[answer.fieldId] = answer.value
    }
    return initial
  })

  const [syncKey, setSyncKey] = useState<string | null>(null)
  const currentSyncKey = open ? `open:${response?.id ?? "new"}` : "closed"
  if (open && currentSyncKey !== syncKey) {
    setSyncKey(currentSyncKey)
    setResponseId(response?.id ?? null)
    setActiveResponse(response)
    setVisitStarted(Boolean(response?.id))
    setVillageId(response?.village.id ?? "")
    setSettlementId(response?.settlement?.id ?? "")
    const initial: AnswerMap = {}
    for (const answer of response?.answers ?? []) {
      initial[answer.fieldId] = answer.value
    }
    setAnswers(initial)
  }

  const fields = useMemo(
    () =>
      activeResponse?.formRevision.fields ??
      response?.formRevision.fields ??
      assignment?.formRevision.fields ??
      [],
    [activeResponse, response, assignment],
  )
  const revisionVersion =
    activeResponse?.formRevision.version ??
    response?.formRevision.version ??
    assignment?.formRevision.version
  const readOnly = !responseIsEditable(
    (activeResponse ?? response)?.status ?? "DRAFT",
  )
  const isResubmit = (activeResponse ?? response)?.status === "REVERTED"
  const reviewRemarks = (activeResponse ?? response)?.reviewRemarks

  const inStartStep = !visitStarted
  const packageId =
    assignment?.procurementPackage.id ??
    activeResponse?.procurementPackage.id ??
    response?.procurementPackage.id
  const packageQuery = useProcurementPackageQuery(packageId, open && Boolean(packageId))
  const pkg = packageQuery.data
  const packageAnswers = useMemo(
    () =>
      pkg
        ? buildPackageFieldAnswers(fields, pkg, answers, villageId || null)
        : {},
    [pkg, fields, answers, villageId],
  )
  const villages = pkg?.villages ?? []
  const settlementsQuery = useSettlementsQuery(villageId || null)
  const settlements = settlementsQuery.data ?? []

  const setAnswer = (fieldId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))
  }

  const answersForSave = useMemo(
    () => ({ ...answers, ...packageAnswers }),
    [answers, packageAnswers],
  )
  const visibleFieldIds = useMemo(
    () => resolveVisibleFieldIds(fields, answersForSave),
    [fields, answersForSave],
  )

  const ensureServerResponse = async (): Promise<string> => {
    if (responseId) return responseId
    if (!assignment) {
      throw new Error("Assignment is missing")
    }
    if (!villageId) {
      throw new Error("Select the village you visited")
    }
    const created = await startMutation.mutateAsync({
      assignmentId: assignment.id,
      villageId,
      settlementId: settlementId || null,
    })
    setResponseId(created.id)
    setActiveResponse(created)
    return created.id
  }

  const handleStart = () => {
    if (!villageId) {
      toast.error("Select the village you visited")
      return
    }
    setVisitStarted(true)
  }

  const handleSaveDraft = async () => {
    try {
      const id = await ensureServerResponse()
      const saved = await saveMutation.mutateAsync({
        id,
        input: { answers: buildAnswers(fields, answersForSave) },
      })
      setActiveResponse(saved)
      toast.success("Draft saved")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save draft")
    }
  }

  const handleSubmit = async () => {
    try {
      const location = await getSubmissionLocation()
      const id = await ensureServerResponse()
      await submitMutation.mutateAsync({
        id,
        input: {
          answers: buildAnswers(fields, answersForSave),
          latitude: location.latitude,
          longitude: location.longitude,
          locationAccuracyMeters: location.accuracyMeters ?? null,
        },
      })
      toast.success(isResubmit ? "Survey resubmitted for review" : "Survey submitted")
      onOpenChange(false)
    } catch (err) {
      if (err instanceof GeolocationError) {
        toast.error(err.message)
        return
      }
      toast.error(err instanceof Error ? err.message : "Failed to submit survey")
    }
  }

  const title = response?.form.title ?? assignment?.formTitle ?? "Survey"
  const uploadContext = useMemo(() => {
    const formId =
      assignment?.formId ??
      activeResponse?.form.id ??
      response?.form.id
    if (!formId) return undefined
    return {
      formId,
      assignmentId: assignment?.id ?? activeResponse?.assignmentId ?? response?.assignmentId,
      responseId: responseId ?? activeResponse?.id ?? response?.id ?? null,
    }
  }, [assignment, activeResponse, response, responseId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {assignment
              ? `${assignment.procurementPackage.name} · ${assignment.tehsil.name}`
              : response
                ? `${response.tehsil.name} · ${response.village.name}`
                : null}
            {revisionVersion ? (
              <span className="mt-1 block text-xs">
                Form version {revisionVersion} (frozen for this submission)
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {reviewRemarks && isResubmit ? (
          <div className="border-b bg-amber-50 px-6 py-3 text-sm dark:bg-amber-950/30">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Reviewer feedback — please address and resubmit
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-100">{reviewRemarks}</p>
          </div>
        ) : null}

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {assignment?.instructions && inStartStep ? (
            <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              {assignment.instructions}
            </p>
          ) : null}

          {inStartStep ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Record which site you visited to start this submission.
              </p>
              <div className="grid gap-1.5">
                <Label>Village</Label>
                <NativeSelect
                  className="w-full"
                  value={villageId}
                  onChange={(e) => {
                    setVillageId(e.target.value)
                    setSettlementId("")
                  }}
                >
                  <NativeSelectOption value="">Select village…</NativeSelectOption>
                  {villages.map((village) => (
                    <NativeSelectOption key={village.id} value={village.id}>
                      {village.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {villages.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    This package has no villages configured.
                  </p>
                ) : null}
              </div>
              <div className="grid gap-1.5">
                <Label>Settlement (optional)</Label>
                <NativeSelect
                  className="w-full"
                  value={settlementId}
                  onChange={(e) => setSettlementId(e.target.value)}
                  disabled={!villageId || settlements.length === 0}
                >
                  <NativeSelectOption value="">None</NativeSelectOption>
                  {settlements.map((settlement) => (
                    <NativeSelectOption key={settlement.id} value={settlement.id}>
                      {settlement.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </div>
          ) : fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading form…</p>
          ) : (
            <div className="space-y-4">
              {fields.map((field) => {
                if (!visibleFieldIds.has(field.id)) return null
                if (field.type === "SECTION_BREAK") {
                  const isOptional = field.config?.optional === true
                  const toggleKey = sectionToggleKey(field.id)
                  const toggled = answersForSave[toggleKey] === "yes"
                  return (
                    <div key={field.id} className="pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{field.label}</p>
                        {isOptional && !readOnly ? (
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">
                              Fill this section?
                            </Label>
                            <NativeSelect
                              className="w-36"
                              value={toggled ? "yes" : "no"}
                              onChange={(e) => setAnswer(toggleKey, e.target.value)}
                            >
                              <NativeSelectOption value="no">No — skip</NativeSelectOption>
                              <NativeSelectOption value="yes">Yes — fill</NativeSelectOption>
                            </NativeSelect>
                          </div>
                        ) : null}
                        {isOptional && readOnly ? (
                          <span className="text-xs text-muted-foreground">
                            {toggled ? "Filled" : "Skipped"}
                          </span>
                        ) : null}
                      </div>
                      <Separator className="mt-1" />
                    </div>
                  )
                }
                return fieldIsPresentational(field.type) ? (
                  <div key={field.id} className="pt-2">
                    <p className="text-sm font-semibold">{field.label}</p>
                    <Separator className="mt-1" />
                  </div>
                ) : (
                  <div key={field.id} className="grid gap-1.5">
                    <Label>
                      {field.label}
                      {field.required ? (
                        <span className="text-destructive"> *</span>
                      ) : null}
                    </Label>
                    {field.helpText ? (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    ) : null}
                    {fieldIsPackageBound(field) ? (
                      <p className="text-xs text-muted-foreground">
                        Populated from the procurement package
                      </p>
                    ) : null}
                    <SurveyFieldControl
                      field={field}
                      value={
                        fieldIsPackageBound(field)
                          ? (packageAnswers[field.id] ?? answers[field.id])
                          : answers[field.id]
                      }
                      onChange={(value) => setAnswer(field.id, value)}
                      disabled={readOnly || fieldIsPackageBound(field)}
                      uploadContext={uploadContext}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {inStartStep ? (
            <Button onClick={handleStart} disabled={!villageId}>
              Continue
            </Button>
          ) : readOnly ? null : (
            <>
              <Button
                variant="secondary"
                onClick={() => void handleSaveDraft()}
                disabled={saveMutation.isPending || submitMutation.isPending}
              >
                {saveMutation.isPending ? "Saving…" : "Save draft"}
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={submitMutation.isPending || saveMutation.isPending}
              >
                {submitMutation.isPending
                  ? "Submitting…"
                  : isResubmit
                    ? "Resubmit for review"
                    : "Submit"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
