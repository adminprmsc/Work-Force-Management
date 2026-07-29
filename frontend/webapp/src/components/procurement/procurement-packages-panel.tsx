import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Eye, ClipboardCheck, Copy, Pencil, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataPanel } from "@/components/common/data-panel"
import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PackageBaselineRequirements } from "@/components/compliance/package-baseline-requirements"
import { MasterEntitySelect } from "@/components/procurement/master-entity-select"
import { PackageBaselineDialog } from "@/components/procurement/package-baseline-dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  useDeleteProcurementPackageMutation,
  useProcurementPackageNamePreviewQuery,
  useProcurementPackagesQuery,
  useTehsilsQuery,
  useUpdateProcurementPackageMutation,
  useVillagesQuery,
} from "@/hooks/api"
import { getQueryViewState, mergeQueryViewStates } from "@/lib/query-view-state"
import { formatCurrency, composePackageNameFromParts } from "@/lib/procurement-package-name"
import type {
  Consultant,
  Contractor,
  ProcurementPackage,
  ProcurementPackageNamePreview,
  Tehsil,
  Village,
} from "@/modules/api/types"

type PackageFormState = {
  name: string
  cluster: string
  code: string
  budgetAmount: string
  contractorId: string
  consultantId: string
  tehsilId: string
  villageIds: string[]
  allocations: Record<string, string>
}

const emptyForm = (): PackageFormState => ({
  name: "",
  cluster: "",
  code: "",
  budgetAmount: "",
  contractorId: "",
  consultantId: "",
  tehsilId: "",
  villageIds: [],
  allocations: {},
})

function packageToForm(pkg: ProcurementPackage): PackageFormState {
  return {
    name: pkg.name,
    cluster: "",
    code: "",
    budgetAmount: pkg.budgetAmount,
    contractorId: pkg.contractor.id,
    consultantId: pkg.consultant.id,
    tehsilId: pkg.tehsil.id,
    villageIds: pkg.villages.map((village) => village.id),
    allocations: Object.fromEntries(
      pkg.villages.map((village) => [village.id, village.allocatedBudget]),
    ),
  }
}

/**
 * Split a budget equally across villages (in whole cents), distributing the
 * remainder cents onto the first villages so the parts sum exactly to the total.
 * Mirrors the backend equal-split logic.
 */
function equalSplitAllocations(
  budget: number,
  villageIds: string[],
): Record<string, string> {
  const result: Record<string, string> = {}
  const n = villageIds.length
  if (n === 0) return result
  if (!Number.isFinite(budget) || budget < 0) {
    for (const id of villageIds) result[id] = "0.00"
    return result
  }
  const totalCents = Math.round(budget * 100)
  const base = Math.floor(totalCents / n)
  const remainder = totalCents - base * n
  villageIds.forEach((id, index) => {
    const cents = base + (index < remainder ? 1 : 0)
    result[id] = (cents / 100).toFixed(2)
  })
  return result
}

type ProcurementPackagesPanelProps = {
  canManage: boolean
  canEditCompliance: boolean
}

export const ProcurementPackagesPanel = memo(function ProcurementPackagesPanel({
  canManage,
  canEditCompliance,
}: ProcurementPackagesPanelProps) {
  const packagesQuery = useProcurementPackagesQuery()
  const contractorsQuery = useContractorsQuery(canManage)
  const consultantsQuery = useConsultantsQuery(canManage)
  const tehsilsQuery = useTehsilsQuery()

  const createMutation = useCreateProcurementPackageMutation()
  const updateMutation = useUpdateProcurementPackageMutation()
  const deleteMutation = useDeleteProcurementPackageMutation()
  const createContractorMutation = useCreateContractorMutation()
  const createConsultantMutation = useCreateConsultantMutation()

  const packagesView = useMemo(
    () => getQueryViewState<ProcurementPackage[]>(packagesQuery),
    [packagesQuery],
  )
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

  const viewState = useMemo(
    () =>
      mergeQueryViewStates([
        packagesView,
        tehsilsView,
        ...(canManage ? [contractorsView, consultantsView] : []),
      ]),
    [canManage, consultantsView, contractorsView, packagesView, tehsilsView],
  )

  const packages = packagesView.data
  const contractors = contractorsView.data
  const consultants = consultantsView.data
  const tehsils = tehsilsView.data

  const [formOpen, setFormOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<ProcurementPackage | null>(null)
  const [form, setForm] = useState<PackageFormState>(emptyForm)
  // When false, per-village allocations follow an automatic equal split.
  const [manualAllocations, setManualAllocations] = useState(false)

  const [detailPackage, setDetailPackage] = useState<ProcurementPackage | null>(null)
  const [compliancePackage, setCompliancePackage] = useState<ProcurementPackage | null>(null)
  const [deletePackage, setDeletePackage] = useState<ProcurementPackage | null>(null)

  const villagesQuery = useVillagesQuery(form.tehsilId || null)
  const namePreviewQuery = useProcurementPackageNamePreviewQuery(
    form.tehsilId || null,
    canManage && formOpen && !editingPackage,
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

  const tehsilDisplayName =
    namePreviewView.data?.tehsilDisplayName ??
    editingPackage?.tehsil.displayName ??
    ""

  const composedName = useMemo(
    () => composePackageNameFromParts(form.cluster, tehsilDisplayName, form.code),
    [form.cluster, form.code, tehsilDisplayName],
  )

  const budgetNum = Number.parseFloat(form.budgetAmount)

  const autoAllocations = useMemo(
    () => equalSplitAllocations(budgetNum, form.villageIds),
    [budgetNum, form.villageIds],
  )

  const effectiveAllocations = useMemo(
    () =>
      manualAllocations
        ? Object.fromEntries(
            form.villageIds.map((id) => [id, form.allocations[id] ?? "0.00"]),
          )
        : autoAllocations,
    [manualAllocations, form.villageIds, form.allocations, autoAllocations],
  )

  const allocationSum = useMemo(
    () =>
      form.villageIds.reduce(
        (sum, id) => sum + (Number.parseFloat(effectiveAllocations[id]) || 0),
        0,
      ),
    [form.villageIds, effectiveAllocations],
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

  const resetToEqualSplit = useCallback(() => {
    setManualAllocations(false)
  }, [])

  useEffect(() => {
    if (!form.tehsilId) return
    if (villagesQuery.isPlaceholderData) return
    setForm((current) => {
      const allowed = new Set(villages?.map((village) => village.id) ?? [])
      const nextVillageIds = current.villageIds.filter((id) => allowed.has(id))
      if (nextVillageIds.length === current.villageIds.length) {
        return current
      }
      return { ...current, villageIds: nextVillageIds }
    })
  }, [form.tehsilId, villages, villagesQuery.isPlaceholderData])

  useEffect(() => {
    if (!formOpen || editingPackage || !namePreviewView.data?.suggestedZoneLabel) return
    setForm((current) => {
      if (current.cluster.trim()) return current
      return { ...current, cluster: namePreviewView.data!.suggestedZoneLabel! }
    })
  }, [editingPackage, formOpen, namePreviewView.data])

  const canSubmit = useMemo(() => {
    const budget = Number.parseFloat(form.budgetAmount)
    const budgetValid = !Number.isNaN(budget) && budget >= 0

    const allocationsValid = !manualAllocations || allocationsMatch

    if (editingPackage) {
      return (
        form.name.trim().length > 0 &&
        form.contractorId.length > 0 &&
        form.consultantId.length > 0 &&
        budgetValid &&
        form.villageIds.length > 0 &&
        allocationsValid
      )
    }

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
  }, [editingPackage, form, manualAllocations, allocationsMatch])

  const openCreate = useCallback(() => {
    setEditingPackage(null)
    setManualAllocations(false)
    setForm({
      ...emptyForm(),
      tehsilId: tehsils?.[0]?.id ?? "",
    })
    setFormOpen(true)
  }, [tehsils])

  const openEdit = useCallback((pkg: ProcurementPackage) => {
    setEditingPackage(pkg)
    // Preserve the package's saved per-village allocations as manual values.
    setManualAllocations(true)
    setForm(packageToForm(pkg))
    setFormOpen(true)
  }, [])

  const toggleVillage = useCallback((villageId: string, checked: boolean) => {
    setForm((current) => {
      const villageIds = checked
        ? [...current.villageIds, villageId]
        : current.villageIds.filter((id) => id !== villageId)
      const allocations = { ...current.allocations }
      if (checked) {
        allocations[villageId] = allocations[villageId] ?? "0.00"
      } else {
        delete allocations[villageId]
      }
      return { ...current, villageIds, allocations }
    })
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    const budgetAmount = Number.parseFloat(form.budgetAmount)
    const villageAllocations = form.villageIds.map((villageId) => ({
      villageId,
      allocatedBudget: Number.parseFloat(effectiveAllocations[villageId]) || 0,
    }))

    try {
      if (editingPackage) {
        await updateMutation.mutateAsync({
          id: editingPackage.id,
          input: {
            name: form.name.trim(),
            budgetAmount,
            contractorId: form.contractorId,
            consultantId: form.consultantId,
            villageIds: form.villageIds,
            villageAllocations,
          },
        })
        toast.success("Procurement package updated")
      } else {
        const payload = {
          cluster: form.cluster.trim(),
          code: form.code.trim(),
          budgetAmount,
          contractorId: form.contractorId,
          consultantId: form.consultantId,
          tehsilId: form.tehsilId,
          villageIds: form.villageIds,
          villageAllocations,
        }
        await createMutation.mutateAsync(payload)
        toast.success("Procurement package created")
      }
      setFormOpen(false)
      setEditingPackage(null)
      setForm(emptyForm())
      setManualAllocations(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save package")
    }
  }, [canSubmit, createMutation, editingPackage, form, effectiveAllocations, updateMutation])

  const handleConfirmDelete = useCallback(async () => {
    if (!deletePackage) return

    try {
      await deleteMutation.mutateAsync(deletePackage.id)
      toast.success("Procurement package deleted")
      setDeletePackage(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete package")
    }
  }, [deleteMutation, deletePackage])

  useEffect(() => {
    if (!detailPackage?.id || !packages) return
    const refreshed = packages.find((pkg) => pkg.id === detailPackage.id)
    if (refreshed) setDetailPackage(refreshed)
  }, [packages, detailPackage?.id])

  return (
    <>
      {canEditCompliance && !canManage ? (
        <PackageBaselineRequirements
          className="mb-6"
          variant="compact"
          title="Before village monitoring surveys"
          description="Open a package and complete the survey-specific baseline fields assigned to it. Each village monitoring form defines its own one-time package requirements."
        />
      ) : null}

      <DataPanel
        title="Procurement packages"
        description={
          canManage
            ? "Manage packages with unique names and allocated ESMP budgets"
            : canEditCompliance
              ? "Open a package and record ESMP baseline before starting village surveys"
              : "View procurement packages and survey-driven budget utilization"
        }
        action={
          canManage ? (
            <Button size="sm" onClick={openCreate} disabled={!tehsils?.length}>
              <Plus className="mr-2 size-4" />
              Create package
            </Button>
          ) : undefined
        }
      >
        {viewState.error ? (
          <p className="text-sm text-destructive">{viewState.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={viewState.isInitialLoading}
            isRefreshing={viewState.isRefreshing}
            shimmer={<TableRowsShimmer rows={6} columns={7} />}
          >
            <Table className="enterprise-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Tehsil</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.length ? (
                  packages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="max-w-[280px] font-medium">
                        <div className="flex items-start gap-1">
                          <span className="line-clamp-2 min-w-0 flex-1">{pkg.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="shrink-0"
                            title="Copy package name"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(pkg.name)
                                toast.success("Package name copied")
                              } catch {
                                toast.error("Could not copy package name")
                              }
                            }}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(pkg.budgetAmount)}</TableCell>
                      <TableCell>{formatCurrency(pkg.totalExpenses)}</TableCell>
                      <TableCell>
                        <span
                          className={
                            Number.parseFloat(pkg.remainingBudget) < 0
                              ? "font-medium text-destructive"
                              : undefined
                          }
                        >
                          {formatCurrency(pkg.remainingBudget)}
                        </span>
                      </TableCell>
                      <TableCell>{pkg.tehsil.displayName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(pkg.createdAt), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEditCompliance ? (
                            <Button
                              size="sm"
                              variant={canManage ? "ghost" : "default"}
                              className={canManage ? "size-8 px-0" : undefined}
                              title="ESMP baseline"
                              onClick={() => setCompliancePackage(pkg)}
                            >
                              <ClipboardCheck
                                className={canManage ? "size-4" : "mr-2 size-4"}
                              />
                              {canManage ? null : (
                                <span className="hidden sm:inline">ESMP baseline</span>
                              )}
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="View details"
                            onClick={() => setDetailPackage(pkg)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          {canManage ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Edit package"
                                onClick={() => openEdit(pkg)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Delete package"
                                disabled={deleteMutation.isPending}
                                onClick={() => setDeletePackage(pkg)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No procurement packages yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ShimmerContainer>
        )}
      </DataPanel>

      {canManage ? (
        <Dialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setEditingPackage(null)
              setForm(emptyForm())
              setManualAllocations(false)
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? "Edit procurement package" : "Create procurement package"}
              </DialogTitle>
              <DialogDescription>
                {editingPackage
                  ? "Rename the package (must be unique), change contractor/consultant, budget, and villages."
                  : "Select a tehsil, then enter Cluster and Code — the full name is formed as Cluster-Tehsil-Code."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {editingPackage ? (
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="grid gap-2">
                    <Label htmlFor="package-name">Package name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="package-name"
                        value={form.name}
                        onChange={(e) =>
                          setForm((current) => ({ ...current, name: e.target.value }))
                        }
                        placeholder="Unique package name"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        title="Copy package name"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(form.name.trim())
                            toast.success("Package name copied")
                          } catch {
                            toast.error("Could not copy package name")
                          }
                        }}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Name must be unique across all procurement packages.
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tehsil</p>
                    <p className="font-medium">{editingPackage.tehsil.displayName}</p>
                  </div>
                </div>
              ) : (
                <>
              <div className="grid gap-2">
                <Label htmlFor="package-tehsil">Tehsil</Label>
                <Select
                  value={form.tehsilId}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      tehsilId: value,
                      villageIds: [],
                      cluster: "",
                    }))
                  }
                >
                  <SelectTrigger id="package-tehsil" className="w-full">
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
                    <span className="font-medium text-foreground">{tehsilDisplayName}</span>
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="package-cluster">Cluster</Label>
                  <Input
                    id="package-cluster"
                    placeholder="e.g. South-I"
                    value={form.cluster}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, cluster: e.target.value }))
                    }
                    disabled={!form.tehsilId}
                  />
                  <p className="text-xs text-muted-foreground">
                    Zone or cluster prefix (auto-suggested from tehsil).
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="package-code">Code</Label>
                  <Input
                    id="package-code"
                    placeholder="e.g. PK-LG& CD-349521-CW-RFB"
                    value={form.code}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, code: e.target.value }))
                    }
                    disabled={!form.tehsilId}
                  />
                  <p className="text-xs text-muted-foreground">
                    Contract or package reference code.
                  </p>
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Full package name
                </p>
                <p className="mt-1 font-mono text-sm leading-relaxed">
                  {composedName || "Select a tehsil and enter Cluster and Code."}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Format: {"{Cluster}-{tehsil}-{Code}"}
                </p>
              </div>
                </>
              )}

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
                    setForm((current) => ({ ...current, budgetAmount: e.target.value }))
                  }
                />
              </div>

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
                  const contractor = await createContractorMutation.mutateAsync(name)
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
                  setForm((current) => ({ ...current, consultantId }))
                }
                items={consultants}
                isCreating={createConsultantMutation.isPending}
                onCreate={async (name) => {
                  const consultant = await createConsultantMutation.mutateAsync(name)
                  return { id: consultant.id }
                }}
              />

              <div className="grid gap-2">
                <Label>Villages</Label>
                {!form.tehsilId ? (
                  <p className="text-sm text-muted-foreground">No tehsil linked to this package.</p>
                ) : villagesView.isInitialLoading ? (
                  <p className="text-sm text-muted-foreground">Loading villages…</p>
                ) : villages?.length ? (
                  <ScrollArea className="h-40 rounded-md border p-3">
                    <div className="grid gap-2">
                      {villages.map((village) => {
                        const checked = form.villageIds.includes(village.id)
                        return (
                          <label
                            key={village.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleVillage(village.id, value === true)
                              }
                            />
                            <span className="text-sm">{village.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No villages found for this tehsil.</p>
                )}
              </div>

              {form.villageIds.length > 0 ? (
                <div className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Label>Per-village budget allocation</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetToEqualSplit}
                      disabled={!manualAllocations}
                    >
                      Reset to equal split
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Budget is split equally by default. Edit individual village amounts — they
                    must sum to the allocated package budget.
                  </p>
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Village</TableHead>
                          <TableHead className="text-right">Allocated (PKR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.villageIds.map((villageId) => {
                          const villageName =
                            villages?.find((village) => village.id === villageId)?.name ??
                            editingPackage?.villages.find((village) => village.id === villageId)
                              ?.name ??
                            villageId
                          return (
                            <TableRow key={villageId}>
                              <TableCell>{villageName}</TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="ml-auto w-36 text-right"
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
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Allocated total:{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(String(allocationSum))}
                      </span>
                      {" / "}
                      {formatCurrency(form.budgetAmount || "0")}
                    </span>
                    {manualAllocations && !allocationsMatch ? (
                      <span className="font-medium text-destructive">
                        Village allocations must sum to the package budget
                        {Number.isFinite(budgetNum)
                          ? ` (remainder ${formatCurrency(String(budgetNum - allocationSum))})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-emerald-700">Allocations match package budget</span>
                    )}
                  </div>
                </div>
              ) : null}

              {!editingPackage ? (
                <PackageBaselineRequirements
                  variant="compact"
                  title="Package baseline is form-defined"
                  description="When you assign a village monitoring survey to this package, the tehsil RA completes whatever one-time baseline fields you define on that survey form."
                />
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleSubmit()}
                disabled={
                  createMutation.isPending || updateMutation.isPending || !canSubmit
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : editingPackage
                    ? "Save changes"
                    : "Create package"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <Dialog
        open={Boolean(detailPackage)}
        onOpenChange={(open) => {
          if (!open) setDetailPackage(null)
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailPackage?.name}</DialogTitle>
            <DialogDescription>
              Package details and budget summary from submitted village monitoring forms
            </DialogDescription>
          </DialogHeader>
          {detailPackage ? (
            <div className="grid gap-5 text-sm">
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Allocated budget</p>
                  <p className="text-lg font-semibold">{formatCurrency(detailPackage.budgetAmount)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total expenses</p>
                  <p className="text-lg font-semibold">{formatCurrency(detailPackage.totalExpenses)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Remaining</p>
                  <p
                    className={`text-lg font-semibold ${
                      Number.parseFloat(detailPackage.remainingBudget) < 0
                        ? "text-destructive"
                        : ""
                    }`}
                  >
                    {formatCurrency(detailPackage.remainingBudget)}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Contractor</p>
                  <p className="font-medium">{detailPackage.contractor.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consultant</p>
                  <p className="font-medium">{detailPackage.consultant.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tehsil</p>
                  <p className="font-medium">{detailPackage.tehsil.displayName}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-muted-foreground">Village budget breakdown</p>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Village</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                        <TableHead className="text-right">Spent</TableHead>
                        <TableHead className="text-right">Remaining</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailPackage.villages.map((village) => (
                        <TableRow key={village.id}>
                          <TableCell>{village.name}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(village.allocatedBudget)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(village.spent)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              Number.parseFloat(village.remaining) < 0
                                ? "text-destructive"
                                : ""
                            }`}
                          >
                            {formatCurrency(village.remaining)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <p className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Total expenses</span> are
                calculated automatically from submitted survey forms. Any field marked
                &quot;Deduct from package budget&quot; (for example PPE, HSE, or environmental
                monitoring utilization on the C-ESMP checklist) is summed across all village
                visits for this package.
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {canManage ? (
        <AlertDialog
          open={Boolean(deletePackage)}
          onOpenChange={(open) => !open && setDeletePackage(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete procurement package?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes {deletePackage?.name} and all associated expenses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  void handleConfirmDelete()
                }}
              >
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}

      <PackageBaselineDialog
        package={compliancePackage}
        open={Boolean(compliancePackage)}
        onOpenChange={(open) => {
          if (!open) setCompliancePackage(null)
        }}
        canEdit={canEditCompliance}
      />
    </>
  )
})
