import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
import { MasterEntitySelect } from "@/components/procurement/master-entity-select"
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
  useCreateProcurementPackageExpenseMutation,
  useCreateProcurementPackageMutation,
  useDeleteProcurementPackageExpenseMutation,
  useDeleteProcurementPackageMutation,
  useProcurementPackageNamePreviewQuery,
  useProcurementPackagesQuery,
  useTehsilsQuery,
  useUpdateProcurementPackageMutation,
  useVillagesQuery,
} from "@/hooks/api"
import { getQueryViewState, mergeQueryViewStates } from "@/lib/query-view-state"
import { formatCurrency, composePackageNameWithTehsil, stripTehsilFromPackageName } from "@/lib/procurement-package-name"
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
  budgetAmount: string
  contractorId: string
  consultantId: string
  tehsilId: string
  villageIds: string[]
}

const emptyForm = (): PackageFormState => ({
  name: "",
  budgetAmount: "",
  contractorId: "",
  consultantId: "",
  tehsilId: "",
  villageIds: [],
})

function packageToForm(pkg: ProcurementPackage): PackageFormState {
  return {
    name: stripTehsilFromPackageName(pkg.name, pkg.tehsil.displayName),
    budgetAmount: pkg.budgetAmount,
    contractorId: pkg.contractor.id,
    consultantId: pkg.consultant.id,
    tehsilId: pkg.tehsil.id,
    villageIds: pkg.villages.map((village) => village.id),
  }
}

type ProcurementPackagesPanelProps = {
  canManage: boolean
}

export const ProcurementPackagesPanel = memo(function ProcurementPackagesPanel({
  canManage,
}: ProcurementPackagesPanelProps) {
  const packagesQuery = useProcurementPackagesQuery()
  const contractorsQuery = useContractorsQuery(canManage)
  const consultantsQuery = useConsultantsQuery(canManage)
  const tehsilsQuery = useTehsilsQuery()

  const createMutation = useCreateProcurementPackageMutation()
  const updateMutation = useUpdateProcurementPackageMutation()
  const deleteMutation = useDeleteProcurementPackageMutation()
  const createExpenseMutation = useCreateProcurementPackageExpenseMutation()
  const deleteExpenseMutation = useDeleteProcurementPackageExpenseMutation()
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

  const [detailPackage, setDetailPackage] = useState<ProcurementPackage | null>(null)
  const [deletePackage, setDeletePackage] = useState<ProcurementPackage | null>(null)
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseDescription, setExpenseDescription] = useState("")

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
    () => composePackageNameWithTehsil(form.name, tehsilDisplayName),
    [form.name, tehsilDisplayName],
  )

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
      if (current.name.trim()) return current
      return { ...current, name: namePreviewView.data!.suggestedZoneLabel! }
    })
  }, [editingPackage, formOpen, namePreviewView.data])

  const canSubmit = useMemo(() => {
    const budget = Number.parseFloat(form.budgetAmount)
    const budgetValid = !Number.isNaN(budget) && budget >= 0

    if (editingPackage) {
      return budgetValid && form.villageIds.length > 0
    }

    return (
      form.name.trim().length > 0 &&
      budgetValid &&
      form.contractorId.length > 0 &&
      form.consultantId.length > 0 &&
      form.tehsilId.length > 0 &&
      form.villageIds.length > 0
    )
  }, [editingPackage, form])

  const openCreate = useCallback(() => {
    setEditingPackage(null)
    setForm({
      ...emptyForm(),
      tehsilId: tehsils?.[0]?.id ?? "",
    })
    setFormOpen(true)
  }, [tehsils])

  const openEdit = useCallback((pkg: ProcurementPackage) => {
    setEditingPackage(pkg)
    setForm(packageToForm(pkg))
    setFormOpen(true)
  }, [])

  const toggleVillage = useCallback((villageId: string, checked: boolean) => {
    setForm((current) => ({
      ...current,
      villageIds: checked
        ? [...current.villageIds, villageId]
        : current.villageIds.filter((id) => id !== villageId),
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    const budgetAmount = Number.parseFloat(form.budgetAmount)

    try {
      if (editingPackage) {
        await updateMutation.mutateAsync({
          id: editingPackage.id,
          input: {
            budgetAmount,
            villageIds: form.villageIds,
          },
        })
        toast.success("Procurement package updated")
      } else {
        const payload = {
          name: form.name.trim(),
          budgetAmount,
          contractorId: form.contractorId,
          consultantId: form.consultantId,
          tehsilId: form.tehsilId,
          villageIds: form.villageIds,
        }
        await createMutation.mutateAsync(payload)
        toast.success("Procurement package created")
      }
      setFormOpen(false)
      setEditingPackage(null)
      setForm(emptyForm())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save package")
    }
  }, [canSubmit, createMutation, editingPackage, form, updateMutation])

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

  const handleAddExpense = useCallback(async () => {
    if (!detailPackage) return
    const amount = Number.parseFloat(expenseAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid expense amount")
      return
    }

    try {
      await createExpenseMutation.mutateAsync({
        packageId: detailPackage.id,
        input: {
          amount,
          description: expenseDescription.trim() || undefined,
        },
      })
      const refreshed = packages?.find((pkg) => pkg.id === detailPackage.id)
      if (refreshed) setDetailPackage(refreshed)
      setExpenseAmount("")
      setExpenseDescription("")
      toast.success("Expense recorded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add expense")
    }
  }, [createExpenseMutation, detailPackage, expenseAmount, expenseDescription, packages])

  const handleDeleteExpense = useCallback(
    async (expenseId: string) => {
      if (!detailPackage) return
      try {
        await deleteExpenseMutation.mutateAsync({
          packageId: detailPackage.id,
          expenseId,
        })
        toast.success("Expense removed")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete expense")
      }
    },
    [deleteExpenseMutation, detailPackage],
  )

  useEffect(() => {
    if (!detailPackage?.id || !packages) return
    const refreshed = packages.find((pkg) => pkg.id === detailPackage.id)
    if (refreshed) setDetailPackage(refreshed)
  }, [packages, detailPackage?.id])

  return (
    <>
      <DataPanel
        title="Procurement packages"
        description={
          canManage
            ? "Manage packages with unique names, allocated budgets, and expense tracking"
            : "View procurement packages, budgets, and expenses for your access level"
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
                        <span className="line-clamp-2">{pkg.name}</span>
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
                  ? "Only the allocated budget and villages can be changed after a package is created."
                  : "Select a tehsil — its name is added to the package name automatically. Enter the rest below."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              {editingPackage ? (
                <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Package name</p>
                    <p className="font-medium">{editingPackage.name}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground">Tehsil</p>
                      <p className="font-medium">{editingPackage.tehsil.displayName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contractor</p>
                      <p className="font-medium">{editingPackage.contractor.name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consultant</p>
                      <p className="font-medium">{editingPackage.consultant.name}</p>
                    </div>
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
                    Tehsil added automatically:{" "}
                    <span className="font-medium text-foreground">{tehsilDisplayName}</span>
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="package-name">Package name</Label>
                <Input
                  id="package-name"
                  placeholder="e.g. Central-I (BNA-01) PK-LG& CD-349521-CW-RFB"
                  value={form.name}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, name: e.target.value }))
                  }
                  disabled={!form.tehsilId}
                />
                <div className="rounded-md border bg-muted/30 px-3 py-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Full package name
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">
                    {composedName || "Select a tehsil and enter the package name details."}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Do not type the tehsil — it is inserted after the zone prefix (e.g. Central-I).
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

              {!editingPackage ? (
                <>
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
                </>
              ) : null}

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
          if (!open) {
            setDetailPackage(null)
            setExpenseAmount("")
            setExpenseDescription("")
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{detailPackage?.name}</DialogTitle>
            <DialogDescription>Package details, budget summary, and expenses</DialogDescription>
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
                <p className="mb-2 text-muted-foreground">Villages</p>
                <div className="flex flex-wrap gap-2">
                  {detailPackage.villages.map((village) => (
                    <Badge key={village.id} variant="secondary">
                      {village.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Expense ledger</h4>
                  <span className="text-xs text-muted-foreground">
                    {detailPackage.expenses.length} record
                    {detailPackage.expenses.length === 1 ? "" : "s"}
                  </span>
                </div>

                {canManage ? (
                  <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="Amount (PKR)"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                    />
                    <Button
                      onClick={() => void handleAddExpense()}
                      disabled={createExpenseMutation.isPending}
                    >
                      Add expense
                    </Button>
                  </div>
                ) : null}

                <Table className="enterprise-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Recorded by</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {canManage ? <TableHead className="text-right">Actions</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailPackage.expenses.length ? (
                      detailPackage.expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            {format(new Date(expense.expenseDate), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell>{expense.description ?? "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {expense.createdBy.username}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          {canManage ? (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Delete expense"
                                disabled={deleteExpenseMutation.isPending}
                                onClick={() => void handleDeleteExpense(expense.id)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={canManage ? 5 : 4}
                          className="text-center text-muted-foreground"
                        >
                          No expenses recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
    </>
  )
})
