import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  PackagePlus,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { DataPanel } from "@/components/common/data-panel"
import { ListItemsShimmer } from "@/components/common/query-shimmer"
import { MasterEntitySelect } from "@/components/procurement/master-entity-select"
import { PackageBaselineRequirements } from "@/components/compliance/package-baseline-requirements"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useConsultantsQuery,
  useContractorsQuery,
  useCreateConsultantMutation,
  useCreateContractorMutation,
  useCreateProcurementPackageMutation,
  useProcurementPackageNamePreviewQuery,
  useTehsilsQuery,
  useVillagesQuery,
} from "@/hooks/api"
import { getQueryViewState } from "@/lib/query-view-state"
import {
  emptyPackageForm,
  equalSplitAllocations,
  type PackageFormState,
} from "@/lib/procurement-package-form"
import { composePackageNameFromParts, formatCurrency } from "@/lib/procurement-package-name"
import { procurementPackagesPath } from "@/lib/procurement-access"
import type { Role as RoleType } from "@/modules/auth/roles"
import type {
  Consultant,
  Contractor,
  ProcurementPackageNamePreview,
  Tehsil,
  Village,
} from "@/modules/api/types"

type ProcurementPackageCreatePanelProps = {
  role: RoleType
}

export const ProcurementPackageCreatePanel = memo(
  function ProcurementPackageCreatePanel({ role }: ProcurementPackageCreatePanelProps) {
    const navigate = useNavigate()
    const listPath = procurementPackagesPath(role)

    const contractorsQuery = useContractorsQuery(true)
    const consultantsQuery = useConsultantsQuery(true)
    const tehsilsQuery = useTehsilsQuery()
    const createMutation = useCreateProcurementPackageMutation()
    const createContractorMutation = useCreateContractorMutation()
    const createConsultantMutation = useCreateConsultantMutation()

    const contractorsView = useMemo(
      () => getQueryViewState<Contractor[]>(contractorsQuery),
      [contractorsQuery],
    )
    const consultantsView = useMemo(
      () => getQueryViewState<Consultant[]>(consultantsQuery),
      [consultantsQuery],
    )
    const tehsilsView = useMemo(
      () => getQueryViewState<Tehsil[]>(tehsilsQuery),
      [tehsilsQuery],
    )

    const contractors = contractorsView.data
    const consultants = consultantsView.data
    const tehsils = tehsilsView.data

    const [form, setForm] = useState<PackageFormState>(() => emptyPackageForm())
    const [manualAllocations, setManualAllocations] = useState(false)
    const [villageSearch, setVillageSearch] = useState("")
    const [seededTehsil, setSeededTehsil] = useState(false)

    if (!seededTehsil && tehsils?.length && !form.tehsilId) {
      setSeededTehsil(true)
      setForm((current) => ({ ...current, tehsilId: tehsils[0]!.id }))
    }

    const villagesQuery = useVillagesQuery(form.tehsilId || null)
    const namePreviewQuery = useProcurementPackageNamePreviewQuery(
      form.tehsilId || null,
      Boolean(form.tehsilId),
    )
    const namePreviewView = useMemo(
      () => getQueryViewState<ProcurementPackageNamePreview>(namePreviewQuery),
      [namePreviewQuery],
    )
    const villagesView = useMemo(
      () => getQueryViewState<Village[]>(villagesQuery),
      [villagesQuery],
    )
    const villages = villagesView.data

    useEffect(() => {
      if (!form.tehsilId) return
      if (villagesQuery.isPlaceholderData) return
      if (!villages) return
      setForm((current) => {
        const allowed = new Set(villages.map((village) => village.id))
        const nextVillageIds = current.villageIds.filter((id) => allowed.has(id))
        if (nextVillageIds.length === current.villageIds.length) return current
        return { ...current, villageIds: nextVillageIds }
      })
    }, [form.tehsilId, villages, villagesQuery.isPlaceholderData])

    useEffect(() => {
      if (!namePreviewView.data?.suggestedZoneLabel) return
      setForm((current) => {
        if (current.cluster.trim()) return current
        return { ...current, cluster: namePreviewView.data!.suggestedZoneLabel! }
      })
    }, [namePreviewView.data])

    const tehsilDisplayName = namePreviewView.data?.tehsilDisplayName ?? ""
    const composedName = useMemo(
      () => composePackageNameFromParts(form.cluster, tehsilDisplayName, form.code),
      [form.cluster, form.code, tehsilDisplayName],
    )

    const filteredVillages = useMemo(() => {
      const options = villages ?? []
      const term = villageSearch.trim().toLowerCase()
      if (!term) return options
      return options.filter((village) => village.name.toLowerCase().includes(term))
    }, [villages, villageSearch])

    const budgetNum = Number.parseFloat(form.budgetAmount)
    const villageIds = useMemo(() => form.villageIds, [form.villageIds])

    const autoAllocations = useMemo(
      () => equalSplitAllocations(budgetNum, villageIds),
      [budgetNum, villageIds],
    )

    const effectiveAllocations = useMemo(
      () =>
        manualAllocations
          ? Object.fromEntries(
              villageIds.map((id) => [id, form.allocations[id] ?? "0.00"]),
            )
          : autoAllocations,
      [manualAllocations, villageIds, form.allocations, autoAllocations],
    )

    const allocationSum = useMemo(
      () =>
        villageIds.reduce(
          (sum, id) => sum + (Number.parseFloat(effectiveAllocations[id]) || 0),
          0,
        ),
      [villageIds, effectiveAllocations],
    )

    const allocationsMatch =
      !Number.isNaN(budgetNum) && Math.abs(allocationSum - budgetNum) <= 0.01

    const setVillageAllocation = useCallback(
      (villageId: string, value: string) => {
        setManualAllocations(true)
        setForm((current) => ({
          ...current,
          allocations: {
            ...(manualAllocations
              ? current.allocations
              : equalSplitAllocations(
                  Number.parseFloat(current.budgetAmount),
                  current.villageIds,
                )),
            [villageId]: value,
          },
        }))
      },
      [manualAllocations],
    )

    const toggleVillage = useCallback((villageId: string, checked: boolean) => {
      setForm((current) => {
        const nextVillageIds = checked
          ? [...current.villageIds, villageId]
          : current.villageIds.filter((id) => id !== villageId)
        const allocations = { ...current.allocations }
        if (checked) {
          allocations[villageId] = allocations[villageId] ?? "0.00"
        } else {
          delete allocations[villageId]
        }
        return { ...current, villageIds: nextVillageIds, allocations }
      })
    }, [])

    const selectAllVisible = useCallback(() => {
      setForm((current) => {
        const nextVillageIds = [...current.villageIds]
        const allocations = { ...current.allocations }
        for (const village of filteredVillages) {
          if (!nextVillageIds.includes(village.id)) {
            nextVillageIds.push(village.id)
            allocations[village.id] = allocations[village.id] ?? "0.00"
          }
        }
        return { ...current, villageIds: nextVillageIds, allocations }
      })
    }, [filteredVillages])

    const clearVisible = useCallback(() => {
      setForm((current) => {
        const visible = new Set(filteredVillages.map((village) => village.id))
        const allocations = { ...current.allocations }
        for (const id of visible) delete allocations[id]
        return {
          ...current,
          villageIds: current.villageIds.filter((id) => !visible.has(id)),
          allocations,
        }
      })
    }, [filteredVillages])

    const canSubmit = useMemo(() => {
      const budget = Number.parseFloat(form.budgetAmount)
      const budgetValid = !Number.isNaN(budget) && budget >= 0
      const allocationsValid = !manualAllocations || allocationsMatch
      return (
        form.cluster.trim().length > 0 &&
        form.code.trim().length > 0 &&
        budgetValid &&
        form.contractorId.length > 0 &&
        form.consultantId.length > 0 &&
        form.tehsilId.length > 0 &&
        form.villageIds.length > 0 &&
        allocationsValid
      )
    }, [allocationsMatch, form, manualAllocations])

    const handleSubmit = useCallback(async () => {
      if (!canSubmit) return
      const budgetAmount = Number.parseFloat(form.budgetAmount)
      const villageAllocations = form.villageIds.map((villageId) => ({
        villageId,
        allocatedBudget: Number.parseFloat(effectiveAllocations[villageId]) || 0,
      }))

      try {
        await createMutation.mutateAsync({
          cluster: form.cluster.trim(),
          code: form.code.trim(),
          budgetAmount,
          contractorId: form.contractorId,
          consultantId: form.consultantId,
          tehsilId: form.tehsilId,
          villageIds: form.villageIds,
          villageAllocations,
        })
        toast.success("Procurement package created")
        void navigate(listPath)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save package")
      }
    }, [
      canSubmit,
      createMutation,
      effectiveAllocations,
      form,
      listPath,
      navigate,
    ])

    const selectedCount = villageIds.length

    return (
      <div className="space-y-6 pb-24">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-4 px-6 py-5">
            <Link
              to={listPath}
              className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              All packages
            </Link>
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                <PackagePlus className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Create procurement package
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a tehsil, then enter Cluster and Code — the full name is formed as
                  Cluster-Tehsil-Code.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-5">
            <DataPanel
              className="xl:col-span-3"
              title="Package details"
              description="Name is built from cluster, tehsil, and code. Budget and partners can be set here."
            >
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="package-tehsil">Tehsil</Label>
                  <Select
                    value={form.tehsilId || undefined}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        tehsilId: value,
                        villageIds: [],
                        cluster: "",
                      }))
                    }
                  >
                    <SelectTrigger id="package-tehsil" className="w-full min-w-0">
                      <SelectValue placeholder="Select tehsil" />
                    </SelectTrigger>
                    <SelectContent>
                      {tehsils?.map((tehsil) => (
                        <SelectItem key={tehsil.id} value={tehsil.id}>
                          {tehsil.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tehsilDisplayName ? (
                    <p className="text-xs text-muted-foreground">
                      Tehsil in package name:{" "}
                      <span className="font-medium text-foreground">
                        {tehsilDisplayName}
                      </span>
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid min-w-0 gap-2">
                    <Label htmlFor="package-cluster">Cluster</Label>
                    <Input
                      id="package-cluster"
                      placeholder="e.g. South-I"
                      value={form.cluster}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          cluster: e.target.value,
                        }))
                      }
                      disabled={!form.tehsilId}
                    />
                    <p className="text-xs text-muted-foreground">
                      Zone or cluster prefix (auto-suggested from tehsil).
                    </p>
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <Label htmlFor="package-code">Code</Label>
                    <Input
                      id="package-code"
                      placeholder="e.g. PK-LG& CD-349521-CW-RFB"
                      value={form.code}
                      onChange={(e) =>
                        setForm((current) => ({
                          ...current,
                          code: e.target.value,
                        }))
                      }
                      disabled={!form.tehsilId}
                    />
                    <p className="text-xs text-muted-foreground">
                      Contract or package reference code.
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/20 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Full package name
                  </p>
                  <p className="mt-1 font-mono text-sm leading-relaxed break-all">
                    {composedName || "Select a tehsil and enter Cluster and Code."}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Format: {"{Cluster}-{tehsil}-{Code}"}
                  </p>
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Label htmlFor="budget-amount">Allocated budget (PKR)</Label>
                  <Input
                    id="budget-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.budgetAmount}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        budgetAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="min-w-0">
                    <MasterEntitySelect
                      id="package-contractor"
                      label="Contractor"
                      placeholder="Select contractor"
                      entityLabel="Contractor"
                      value={form.contractorId}
                      onValueChange={(contractorId) =>
                        setForm((current) => ({ ...current, contractorId }))
                      }
                      items={contractors}
                      isCreating={createContractorMutation.isPending}
                      onCreate={async (name) => {
                        const contractor =
                          await createContractorMutation.mutateAsync(name)
                        return { id: contractor.id }
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <MasterEntitySelect
                      id="package-consultant"
                      label="Consultant"
                      placeholder="Select consultant"
                      entityLabel="Consultant"
                      value={form.consultantId}
                      onValueChange={(consultantId) =>
                        setForm((current) => ({ ...current, consultantId }))
                      }
                      items={consultants}
                      isCreating={createConsultantMutation.isPending}
                      onCreate={async (name) => {
                        const consultant =
                          await createConsultantMutation.mutateAsync(name)
                        return { id: consultant.id }
                      }}
                    />
                  </div>
                </div>

                <PackageBaselineRequirements
                  variant="compact"
                  title="Package baseline is form-defined"
                  description="When you assign a village monitoring survey to this package, the tehsil RA completes whatever one-time baseline fields you define on that survey form."
                />
              </div>
            </DataPanel>

            <DataPanel
              className="xl:col-span-2"
              title="Villages"
              description="Choose the villages covered by this package."
              action={
                <Badge variant={selectedCount > 0 ? "default" : "outline"}>
                  {selectedCount} selected
                </Badge>
              }
            >
              <div className="grid gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={villageSearch}
                    onChange={(e) => setVillageSearch(e.target.value)}
                    placeholder="Search villages"
                    className="pl-9"
                    aria-label="Search villages"
                    disabled={!form.tehsilId}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {filteredVillages.length} of {villages?.length ?? 0} shown
                  </p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={selectAllVisible}
                      disabled={filteredVillages.length === 0}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearVisible}
                      disabled={filteredVillages.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {!form.tehsilId ? (
                  <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      Select a tehsil to load villages.
                    </p>
                  </div>
                ) : villagesView.isInitialLoading ? (
                  <ListItemsShimmer items={6} />
                ) : filteredVillages.length ? (
                  <ScrollArea className="h-72 rounded-lg border">
                    <div className="divide-y">
                      {filteredVillages.map((village) => {
                        const checked = form.villageIds.includes(village.id)
                        return (
                          <label
                            key={village.id}
                            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleVillage(village.id, value === true)
                              }
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {village.name}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="rounded-lg border border-dashed px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      {villageSearch.trim()
                        ? `No villages match “${villageSearch.trim()}”.`
                        : "No villages found for this tehsil."}
                    </p>
                  </div>
                )}
              </div>
            </DataPanel>
          </div>

          {form.villageIds.length > 0 ? (
            <DataPanel
              title="Per-village budget allocation"
              description="Budget is split equally by default. Edit individual amounts — they must sum to the package budget."
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setManualAllocations(false)}
                  disabled={!manualAllocations}
                >
                  Reset to equal split
                </Button>
              }
              contentClassName="pt-0"
            >
              <div className="overflow-hidden rounded-lg border">
                <Table className="enterprise-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Village</TableHead>
                      <TableHead className="w-48 text-right">Allocated (PKR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {form.villageIds.map((villageId) => {
                      const villageName =
                        villages?.find((village) => village.id === villageId)?.name ??
                        villageId
                      return (
                        <TableRow key={villageId}>
                          <TableCell className="font-medium">{villageName}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              className="ml-auto w-40 text-right"
                              value={effectiveAllocations[villageId] ?? "0.00"}
                              onChange={(e) =>
                                setVillageAllocation(villageId, e.target.value)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div
                className={
                  manualAllocations && !allocationsMatch
                    ? "mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3"
                    : "mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/20 px-4 py-3"
                }
              >
                <span className="text-sm text-muted-foreground">
                  Allocated total{" "}
                  <span className="font-semibold text-foreground">
                    {formatCurrency(String(allocationSum))}
                  </span>{" "}
                  of {formatCurrency(form.budgetAmount || "0")}
                </span>
                {manualAllocations && !allocationsMatch ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-destructive">
                    <AlertCircle className="size-4" />
                    Must sum to the package budget
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" />
                    Allocations match the package budget
                  </span>
                )}
              </div>
            </DataPanel>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-20 -mx-2 border-t bg-background/85 px-2 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" asChild>
              <Link to={listPath}>Cancel</Link>
            </Button>
            <Button
              onClick={() => void handleSubmit()}
              disabled={createMutation.isPending || !canSubmit}
            >
              {createMutation.isPending ? "Creating…" : "Create package"}
            </Button>
          </div>
        </div>
      </div>
    )
  },
)
