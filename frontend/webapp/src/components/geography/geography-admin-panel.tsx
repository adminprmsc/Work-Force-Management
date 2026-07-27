import { memo, useCallback, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
import {
  ListItemsShimmer,
  SelectFieldShimmer,
  ShimmerContainer,
} from "@/components/common/query-shimmer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  useCreateSettlementMutation,
  useCreateVillageMutation,
  useDeleteSettlementMutation,
  useDeleteVillageMutation,
  useSettlementsQuery,
  useTehsilsQuery,
  useUpdateSettlementMutation,
  useUpdateVillageMutation,
  useVillagesQuery,
} from "@/hooks/api"
import { getQueryViewState } from "@/lib/query-view-state"
import type { Settlement, Tehsil, Village } from "@/modules/api/types"

type NameDialogState =
  | { mode: "create-village" }
  | { mode: "rename-village"; village: Village }
  | { mode: "create-settlement" }
  | { mode: "rename-settlement"; settlement: Settlement }
  | null

type DeleteDialogState =
  | { type: "village"; village: Village }
  | { type: "settlement"; settlement: Settlement }
  | null

export const GeographyAdminPanel = memo(function GeographyAdminPanel() {
  const tehsilsQuery = useTehsilsQuery()
  const tehsilsView = useMemo(() => getQueryViewState<Tehsil[]>(tehsilsQuery), [tehsilsQuery])
  const tehsils = tehsilsView.data

  const [selectedTehsilId, setSelectedTehsilId] = useState<string | null>(null)
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null)

  const activeTehsilId = selectedTehsilId ?? tehsils?.[0]?.id ?? null
  const villagesQuery = useVillagesQuery(activeTehsilId)
  const villagesView = useMemo(() => getQueryViewState<Village[]>(villagesQuery), [villagesQuery])
  const villages = villagesView.data

  const selectedTehsil = tehsils?.find((t) => t.id === activeTehsilId) ?? null
  const activeVillageId =
    selectedVillageId && villages?.some((v) => v.id === selectedVillageId)
      ? selectedVillageId
      : (villages?.[0]?.id ?? null)
  const selectedVillage = villages?.find((v) => v.id === activeVillageId) ?? null

  const settlementsQuery = useSettlementsQuery(activeVillageId)
  const settlementsView = useMemo(
    () => getQueryViewState<Settlement[]>(settlementsQuery),
    [settlementsQuery],
  )
  const settlements = settlementsView.data

  const createVillageMutation = useCreateVillageMutation()
  const updateVillageMutation = useUpdateVillageMutation()
  const deleteVillageMutation = useDeleteVillageMutation()
  const createSettlementMutation = useCreateSettlementMutation()
  const updateSettlementMutation = useUpdateSettlementMutation()
  const deleteSettlementMutation = useDeleteSettlementMutation()

  const [nameDialog, setNameDialog] = useState<NameDialogState>(null)
  const [nameValue, setNameValue] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null)

  const openCreateVillage = useCallback(() => {
    setNameValue("")
    setNameDialog({ mode: "create-village" })
  }, [])

  const openRenameVillage = useCallback((village: Village) => {
    setNameValue(village.name)
    setNameDialog({ mode: "rename-village", village })
  }, [])

  const openCreateSettlement = useCallback(() => {
    setNameValue("")
    setNameDialog({ mode: "create-settlement" })
  }, [])

  const openRenameSettlement = useCallback((settlement: Settlement) => {
    setNameValue(settlement.name)
    setNameDialog({ mode: "rename-settlement", settlement })
  }, [])

  const saving =
    createVillageMutation.isPending ||
    updateVillageMutation.isPending ||
    createSettlementMutation.isPending ||
    updateSettlementMutation.isPending

  const deleting =
    deleteVillageMutation.isPending || deleteSettlementMutation.isPending

  const handleSaveName = useCallback(async () => {
    if (!nameDialog || !activeTehsilId) return
    const name = nameValue.trim()
    if (!name) return

    try {
      switch (nameDialog.mode) {
        case "create-village":
          await createVillageMutation.mutateAsync({ tehsilId: activeTehsilId, name })
          toast.success("Village created")
          break
        case "rename-village":
          await updateVillageMutation.mutateAsync({
            id: nameDialog.village.id,
            tehsilId: activeTehsilId,
            name,
          })
          toast.success("Village renamed")
          break
        case "create-settlement":
          if (!activeVillageId) return
          await createSettlementMutation.mutateAsync({
            villageId: activeVillageId,
            tehsilId: activeTehsilId,
            name,
          })
          toast.success("Settlement created")
          break
        case "rename-settlement":
          await updateSettlementMutation.mutateAsync({
            id: nameDialog.settlement.id,
            villageId: nameDialog.settlement.villageId,
            name,
          })
          toast.success("Settlement renamed")
          break
      }
      setNameDialog(null)
      setNameValue("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed")
    }
  }, [
    activeTehsilId,
    activeVillageId,
    createSettlementMutation,
    createVillageMutation,
    nameDialog,
    nameValue,
    updateSettlementMutation,
    updateVillageMutation,
  ])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialog || !activeTehsilId) return

    try {
      if (deleteDialog.type === "village") {
        await deleteVillageMutation.mutateAsync({
          id: deleteDialog.village.id,
          tehsilId: activeTehsilId,
        })
        if (selectedVillageId === deleteDialog.village.id) {
          setSelectedVillageId(null)
        }
        toast.success("Village deleted")
      } else {
        await deleteSettlementMutation.mutateAsync({
          id: deleteDialog.settlement.id,
          villageId: deleteDialog.settlement.villageId,
          tehsilId: activeTehsilId,
        })
        toast.success("Settlement deleted")
      }
      setDeleteDialog(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }, [
    activeTehsilId,
    deleteDialog,
    deleteSettlementMutation,
    deleteVillageMutation,
    selectedVillageId,
  ])

  const nameDialogTitle = (() => {
    if (!nameDialog) return ""
    switch (nameDialog.mode) {
      case "create-village":
        return "Add village"
      case "rename-village":
        return "Rename village"
      case "create-settlement":
        return "Add settlement"
      case "rename-settlement":
        return "Rename settlement"
    }
  })()

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manage geography</CardTitle>
          <CardDescription>
            Add, rename, or remove villages and settlements under a tehsil. Delete is
            blocked when the record is still in use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {tehsilsView.error ? (
            <p className="text-sm text-destructive">{tehsilsView.error}</p>
          ) : (
            <ShimmerContainer
              isInitialLoading={tehsilsView.isInitialLoading}
              shimmer={<SelectFieldShimmer />}
            >
              <div className="grid gap-1.5">
                <Label>Tehsil</Label>
                <Select
                  value={activeTehsilId ?? undefined}
                  onValueChange={(value) => {
                    setSelectedTehsilId(value)
                    setSelectedVillageId(null)
                  }}
                >
                  <SelectTrigger className="w-full sm:w-80">
                    <SelectValue placeholder="Select tehsil" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tehsils ?? []).map((tehsil) => (
                      <SelectItem key={tehsil.id} value={tehsil.id}>
                        {tehsil.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </ShimmerContainer>
          )}

          {selectedTehsil ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Villages</p>
                    <p className="text-xs text-muted-foreground">{selectedTehsil.name}</p>
                  </div>
                  <Button size="sm" onClick={openCreateVillage} disabled={!activeTehsilId}>
                    <Plus className="mr-1 size-4" />
                    Add
                  </Button>
                </div>
                <Separator />
                {villagesView.error ? (
                  <p className="text-sm text-destructive">{villagesView.error}</p>
                ) : (
                  <ShimmerContainer
                    isInitialLoading={villagesView.isInitialLoading}
                    shimmer={<ListItemsShimmer items={5} />}
                  >
                    {(villages ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No villages yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {(villages ?? []).map((village) => {
                          const active = village.id === activeVillageId
                          return (
                            <li
                              key={village.id}
                              className={`flex items-center gap-1 rounded-md border px-2 py-1.5 ${
                                active ? "border-primary/40 bg-muted/40" : ""
                              }`}
                            >
                              <button
                                type="button"
                                className="min-w-0 flex-1 truncate text-left text-sm"
                                onClick={() => setSelectedVillageId(village.id)}
                              >
                                {village.name}
                              </button>
                              <Badge variant="outline">{village.settlementCount}</Badge>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openRenameVillage(village)}
                                title="Rename"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteDialog({ type: "village", village })}
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </ShimmerContainer>
                )}
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Settlements</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVillage?.name ?? "Select a village"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={openCreateSettlement}
                    disabled={!activeVillageId}
                  >
                    <Plus className="mr-1 size-4" />
                    Add
                  </Button>
                </div>
                <Separator />
                {!activeVillageId ? (
                  <p className="text-sm text-muted-foreground">
                    Select a village to manage settlements.
                  </p>
                ) : settlementsView.error ? (
                  <p className="text-sm text-destructive">{settlementsView.error}</p>
                ) : (
                  <ShimmerContainer
                    isInitialLoading={settlementsView.isInitialLoading}
                    shimmer={<ListItemsShimmer items={5} />}
                  >
                    {(settlements ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No settlements yet.</p>
                    ) : (
                      <ul className="space-y-1">
                        {(settlements ?? []).map((settlement) => (
                          <li
                            key={settlement.id}
                            className="flex items-center gap-1 rounded-md border px-2 py-1.5"
                          >
                            <span className="min-w-0 flex-1 truncate text-sm">
                              {settlement.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openRenameSettlement(settlement)}
                              title="Rename"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                setDeleteDialog({ type: "settlement", settlement })
                              }
                              title="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ShimmerContainer>
                )}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={nameDialog !== null}
        onOpenChange={(open) => {
          if (!open) setNameDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{nameDialogTitle}</DialogTitle>
            <DialogDescription>Enter a unique name within the parent.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="geography-name">Name</Label>
            <Input
              id="geography-name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveName()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialog(null)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveName()} disabled={!nameValue.trim() || saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete{" "}
              {deleteDialog?.type === "village"
                ? deleteDialog.village.name
                : deleteDialog?.settlement.name}
              ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. Deletion is blocked if the record is still linked to
              packages, survey responses, or child settlements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmDelete()
              }}
              disabled={deleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
})
