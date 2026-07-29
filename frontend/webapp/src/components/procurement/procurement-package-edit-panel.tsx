import { memo, useCallback, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  MapPin,
  Package as PackageIcon,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { DataPanel } from "@/components/common/data-panel"
import {
  ListItemsShimmer,
  ShimmerContainer,
  TableRowsShimmer,
} from "@/components/common/query-shimmer"
import { MasterEntitySelect } from "@/components/procurement/master-entity-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
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
  useProcurementPackageQuery,
  useUpdateProcurementPackageMutation,
  useVillagesQuery,
} from "@/hooks/api"
import { getQueryViewState } from "@/lib/query-view-state"
import {
  buildPackageUpdateInput,
  equalSplitAllocations,
  packageToForm,
  type PackageFormState,
} from "@/lib/procurement-package-form"
import { formatCurrency } from "@/lib/procurement-package-name"
import { procurementPackagesPath } from "@/lib/procurement-access"
import type { Role as RoleType } from "@/modules/auth/roles"
import type { Consultant, Contractor, ProcurementPackage, Village } from "@/modules/api/types"

type ProcurementPackageEditPanelProps = {
  packageId: string
  role: RoleType
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "negative"
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          tone === "negative"
            ? "truncate text-lg font-semibold text-destructive"
            : "truncate text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  )
}

export const ProcurementPackageEditPanel = memo(function ProcurementPackageEditPanel({
  packageId,
  role,
}: ProcurementPackageEditPanelProps) {
  const navigate = useNavigate()
  const listPath = procurementPackagesPath(role)

  const packageQuery = useProcurementPackageQuery(packageId)
  const contractorsQuery = useContractorsQuery(true)
  const consultantsQuery = useConsultantsQuery(true)
  const updateMutation = useUpdateProcurementPackageMutation()
  const createContractorMutation = useCreateContractorMutation()
  const createConsultantMutation = useCreateConsultantMutation()

  const packageView = useMemo(
    () => getQueryViewState<ProcurementPackage>(packageQuery),
    [packageQuery],
  )
  const contractorsView = useMemo(
    () => getQueryViewState<Contractor[]>(contractorsQuery),
    [contractorsQuery],
  )
  const consultantsView = useMemo(
    () => getQueryViewState<Consultant[]>(consultantsQuery),
    [consultantsQuery],
  )

  const pkg = packageView.data
  const contractors = contractorsView.data
  const consultants = consultantsView.data

  const [form, setForm] = useState<PackageFormState | null>(null)
  const [manualAllocations, setManualAllocations] = useState(true)
  const [initializedForId, setInitializedForId] = useState<string | null>(null)
  const [villageSearch, setVillageSearch] = useState("")

  // Seed the draft from the loaded package during render (React's
  // "adjusting state when a prop changes" pattern) so the first paint already
  // has the saved villages checked.
  if (pkg && pkg.id === packageId && initializedForId !== pkg.id) {
    setInitializedForId(pkg.id)
    setForm(packageToForm(pkg))
    setManualAllocations(true)
  }

  const villagesQuery = useVillagesQuery(form?.tehsilId || pkg?.tehsil.id || null)
  const villagesView = useMemo(
    () => getQueryViewState<Village[]>(villagesQuery),
    [villagesQuery],
  )
  const villages = villagesView.data

  const villageOptions = useMemo(() => {
    const byId = new Map<string, Village>()
    for (const village of villages ?? []) {
      byId.set(village.id, village)
    }
    for (const village of pkg?.villages ?? []) {
      if (!byId.has(village.id)) {
        byId.set(village.id, {
          id: village.id,
          name: village.name,
          tehsilId: pkg!.tehsil.id,
          settlementCount: 0,
          createdAt: "",
        })
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [pkg, villages])

  const filteredVillages = useMemo(() => {
    const term = villageSearch.trim().toLowerCase()
    if (!term) return villageOptions
    return villageOptions.filter((village) => village.name.toLowerCase().includes(term))
  }, [villageOptions, villageSearch])

  const budgetNum = Number.parseFloat(form?.budgetAmount ?? "")
  const villageIds = useMemo(() => form?.villageIds ?? [], [form?.villageIds])

  const autoAllocations = useMemo(
    () => equalSplitAllocations(budgetNum, villageIds),
    [budgetNum, villageIds],
  )

  const effectiveAllocations = useMemo(
    () =>
      manualAllocations
        ? Object.fromEntries(
            villageIds.map((id) => [id, form?.allocations[id] ?? "0.00"]),
          )
        : autoAllocations,
    [manualAllocations, villageIds, form?.allocations, autoAllocations],
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

  const pendingInput = useMemo(() => {
    if (!pkg || !form) return null
    return buildPackageUpdateInput(pkg, form, effectiveAllocations)
  }, [effectiveAllocations, form, pkg])

  const isDirty = Boolean(pendingInput && Object.keys(pendingInput).length > 0)

  const setVillageAllocation = useCallback(
    (villageId: string, value: string) => {
      setManualAllocations(true)
      setForm((current) => {
        if (!current) return current
        return {
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
        }
      })
    },
    [manualAllocations],
  )

  const toggleVillage = useCallback((villageId: string, checked: boolean) => {
    setForm((current) => {
      if (!current) return current
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
      if (!current) return current
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
      if (!current) return current
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

  const resetForm = useCallback(() => {
    if (!pkg) return
    setForm(packageToForm(pkg))
    setManualAllocations(true)
  }, [pkg])

  const canSubmit = useMemo(() => {
    if (!form || !pkg) return false
    const budget = Number.parseFloat(form.budgetAmount)
    const budgetValid = !Number.isNaN(budget) && budget >= 0
    const allocationsValid = !manualAllocations || allocationsMatch
    return (
      form.name.trim().length > 0 &&
      form.contractorId.length > 0 &&
      form.consultantId.length > 0 &&
      form.villageIds.length > 0 &&
      budgetValid &&
      allocationsValid &&
      isDirty
    )
  }, [allocationsMatch, form, isDirty, manualAllocations, pkg])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !pkg || !pendingInput) return

    try {
      await updateMutation.mutateAsync({ id: pkg.id, input: pendingInput })
      toast.success("Procurement package updated")
      void navigate(listPath)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save package")
    }
  }, [canSubmit, listPath, navigate, pendingInput, pkg, updateMutation])

  const copyName = useCallback(async () => {
    if (!form) return
    try {
      await navigator.clipboard.writeText(form.name.trim())
      toast.success("Package name copied")
    } catch {
      toast.error("Could not copy package name")
    }
  }, [form])

  if (packageView.error) {
    return (
      <div className="space-y-4">
        <Link
          to={listPath}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All packages
        </Link>
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Could not load this package</p>
            <p className="mt-1 text-sm text-muted-foreground">{packageView.error}</p>
          </div>
        </div>
      </div>
    )
  }

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

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-primary">
                <PackageIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Edit procurement package
                  </h2>
                  {isDirty ? <Badge variant="secondary">Unsaved changes</Badge> : null}
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  {pkg ? (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {pkg.tehsil.displayName}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="truncate font-medium text-foreground">{pkg.name}</span>
                    </>
                  ) : (
                    "Loading package…"
                  )}
                </p>
              </div>
            </div>

            {pkg ? (
              <div className="grid shrink-0 grid-cols-3 gap-6 rounded-lg border bg-muted/20 px-4 py-3">
                <SummaryStat label="Allocated" value={formatCurrency(pkg.budgetAmount)} />
                <SummaryStat label="Spent" value={formatCurrency(pkg.totalExpenses)} />
                <SummaryStat
                  label="Remaining"
                  value={formatCurrency(pkg.remainingBudget)}
                  tone={
                    Number.parseFloat(pkg.remainingBudget) < 0 ? "negative" : undefined
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <ShimmerContainer
        isInitialLoading={packageView.isInitialLoading || !form}
        isRefreshing={packageView.isRefreshing}
        shimmer={<TableRowsShimmer rows={8} columns={2} />}
      >
        {form && pkg ? (
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-5">
              <DataPanel
                className="xl:col-span-3"
                title="Package details"
                description="Rename the package and update its budget, contractor, and consultant."
              >
                <div className="grid gap-5">
                  <div className="grid gap-2">
                    <Label htmlFor="package-name">Package name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="package-name"
                        value={form.name}
                        onChange={(e) =>
                          setForm((current) =>
                            current ? { ...current, name: e.target.value } : current,
                          )
                        }
                        placeholder="Unique package name"
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Copy package name"
                        onClick={() => void copyName()}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Must be unique across all procurement packages. Tehsil is fixed at{" "}
                      <span className="font-medium text-foreground">
                        {pkg.tehsil.displayName}
                      </span>
                      .
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
                        setForm((current) =>
                          current
                            ? { ...current, budgetAmount: e.target.value }
                            : current,
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Changing the budget re-derives the per-village split below.
                    </p>
                  </div>

                  <Separator />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <MasterEntitySelect
                      id="package-contractor"
                      label="Contractor"
                      placeholder="Select contractor"
                      entityLabel="Contractor"
                      value={form.contractorId}
                      onValueChange={(contractorId) =>
                        setForm((current) =>
                          current ? { ...current, contractorId } : current,
                        )
                      }
                      items={contractors}
                      isCreating={createContractorMutation.isPending}
                      onCreate={async (name) => {
                        const contractor =
                          await createContractorMutation.mutateAsync(name)
                        return { id: contractor.id }
                      }}
                    />

                    <MasterEntitySelect
                      id="package-consultant"
                      label="Consultant"
                      placeholder="Select consultant"
                      entityLabel="Consultant"
                      value={form.consultantId}
                      onValueChange={(consultantId) =>
                        setForm((current) =>
                          current ? { ...current, consultantId } : current,
                        )
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
              </DataPanel>

              <DataPanel
                className="xl:col-span-2"
                title="Villages"
                description="Already-linked villages stay checked until you change them."
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
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {filteredVillages.length} of {villageOptions.length} shown
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

                  {villagesView.isInitialLoading && villageOptions.length === 0 ? (
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
                              {checked ? (
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {formatCurrency(
                                    effectiveAllocations[village.id] ?? "0",
                                  )}
                                </span>
                              ) : null}
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
                description="Existing allocations are kept. Edit only what needs to change — the parts must sum to the package budget."
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
                          villageOptions.find((village) => village.id === villageId)
                            ?.name ?? villageId
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
                      {Number.isFinite(budgetNum)
                        ? ` (off by ${formatCurrency(String(budgetNum - allocationSum))})`
                        : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="size-4" />
                      Allocations match the package budget
                    </span>
                  )}
                </div>
              </DataPanel>
            ) : (
              <div className="rounded-xl border border-dashed px-6 py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Select at least one village to allocate the package budget.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </ShimmerContainer>

      {form && pkg ? (
        <div className="sticky bottom-0 z-20 -mx-2 border-t bg-background/85 px-2 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isDirty
                ? "You have unsaved changes."
                : "No changes yet — everything matches the saved package."}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                onClick={resetForm}
                disabled={!isDirty || updateMutation.isPending}
              >
                Discard changes
              </Button>
              <Button variant="outline" asChild>
                <Link to={listPath}>Cancel</Link>
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={updateMutation.isPending || !canSubmit}
              >
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
})
