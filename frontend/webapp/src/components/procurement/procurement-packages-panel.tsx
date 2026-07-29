import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
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
import { ListPagination } from "@/components/common/list-pagination"
import {
  DEFAULT_PAGE_SIZE,
  type PageSizeOption,
} from "@/lib/list-pagination"
import { ShimmerContainer, TableRowsShimmer } from "@/components/common/query-shimmer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PackageBaselineRequirements } from "@/components/compliance/package-baseline-requirements"
import { PackageBaselineDialog } from "@/components/procurement/package-baseline-dialog"
import { PackageActivityTimeline } from "@/components/procurement/package-activity-timeline"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useDeleteProcurementPackageMutation,
  useProcurementPackagesQuery,
  useTehsilsQuery,
} from "@/hooks/api"
import { getQueryViewState, mergeQueryViewStates } from "@/lib/query-view-state"
import { formatCurrency } from "@/lib/procurement-package-name"
import {
  procurementPackageCreatePath,
  procurementPackageEditPath,
} from "@/lib/procurement-access"
import { useAuth } from "@/modules/auth/use-auth"
import type {
  PaginatedResponse,
  ProcurementPackage,
  Tehsil,
} from "@/modules/api/types"

type ProcurementPackagesPanelProps = {
  canManage: boolean
  canEditCompliance: boolean
}

export const ProcurementPackagesPanel = memo(function ProcurementPackagesPanel({
  canManage,
  canEditCompliance,
}: ProcurementPackagesPanelProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE)

  const packagesQuery = useProcurementPackagesQuery({ page, limit: pageSize })
  const tehsilsQuery = useTehsilsQuery()
  const deleteMutation = useDeleteProcurementPackageMutation()

  const packagesView = useMemo(
    () => getQueryViewState<PaginatedResponse<ProcurementPackage>>(packagesQuery),
    [packagesQuery],
  )
  const tehsilsView = useMemo(
    () => getQueryViewState<Tehsil[]>(tehsilsQuery),
    [tehsilsQuery],
  )

  const viewState = useMemo(
    () => mergeQueryViewStates([packagesView, tehsilsView]),
    [packagesView, tehsilsView],
  )

  const packages = useMemo(
    () => packagesView.data?.items ?? [],
    [packagesView.data?.items],
  )
  const total = packagesView.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (page > totalPages) {
    setPage(totalPages)
  }
  const tehsils = tehsilsView.data

  const handlePageSizeChange = useCallback((next: PageSizeOption) => {
    setPageSize(next)
    setPage(1)
  }, [])

  const [detailPackage, setDetailPackage] = useState<ProcurementPackage | null>(null)
  const [compliancePackage, setCompliancePackage] = useState<ProcurementPackage | null>(null)
  const [deletePackage, setDeletePackage] = useState<ProcurementPackage | null>(null)

  const openCreate = useCallback(() => {
    if (!user) return
    void navigate(procurementPackageCreatePath(user.role))
  }, [navigate, user])

  const openEdit = useCallback(
    (pkg: ProcurementPackage) => {
      if (!user) return
      void navigate(procurementPackageEditPath(user.role, pkg.id))
    },
    [navigate, user],
  )

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
                {packages.length ? (
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No procurement packages yet.
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
          label="packages"
        />
      </DataPanel>

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
              Package details, budget summary, and complete activity history
            </DialogDescription>
          </DialogHeader>
          {detailPackage ? (
            <Tabs defaultValue="details" className="gap-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="grid gap-5 text-sm">
              <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Allocated budget</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(detailPackage.budgetAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total expenses</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(detailPackage.totalExpenses)}
                  </p>
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
                            className={`text-right ${
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
              </TabsContent>
              <TabsContent value="history">
                <PackageActivityTimeline packageId={detailPackage.id} />
              </TabsContent>
            </Tabs>
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
