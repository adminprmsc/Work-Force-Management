import { memo, useCallback, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getQueryViewState } from "@/lib/query-view-state"
import type { MasterEntity } from "@/modules/api/types"
import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query"

type MasterEntityPanelProps = {
  title: string
  description: string
  entityLabel: string
  query: UseQueryResult<MasterEntity[]>
  createMutation: UseMutationResult<MasterEntity, Error, string>
  updateMutation: UseMutationResult<MasterEntity, Error, { id: string; name: string }>
  deleteMutation: UseMutationResult<{ success: boolean }, Error, string>
}

export const MasterEntityPanel = memo(function MasterEntityPanel({
  title,
  description,
  entityLabel,
  query,
  createMutation,
  updateMutation,
  deleteMutation,
}: MasterEntityPanelProps) {
  const view = useMemo(() => getQueryViewState<MasterEntity[]>(query), [query])
  const items = view.data

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")

  const [editItem, setEditItem] = useState<MasterEntity | null>(null)
  const [editName, setEditName] = useState("")

  const [deleteItem, setDeleteItem] = useState<MasterEntity | null>(null)

  const handleCreate = useCallback(async () => {
    const name = createName.trim()
    if (!name) return

    try {
      await createMutation.mutateAsync(name)
      toast.success(`${entityLabel} created`)
      setCreateOpen(false)
      setCreateName("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to create ${entityLabel.toLowerCase()}`)
    }
  }, [createMutation, createName, entityLabel])

  const handleSaveEdit = useCallback(async () => {
    if (!editItem) return
    const name = editName.trim()
    if (!name) return

    try {
      await updateMutation.mutateAsync({ id: editItem.id, name })
      toast.success(`${entityLabel} updated`)
      setEditItem(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to update ${entityLabel.toLowerCase()}`)
    }
  }, [editItem, editName, entityLabel, updateMutation])

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteItem) return

    try {
      await deleteMutation.mutateAsync(deleteItem.id)
      toast.success(`${entityLabel} deleted`)
      setDeleteItem(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to delete ${entityLabel.toLowerCase()}`)
    }
  }, [deleteItem, deleteMutation, entityLabel])

  return (
    <>
      <DataPanel
        title={title}
        description={description}
        action={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Add {entityLabel.toLowerCase()}
          </Button>
        }
      >
        {view.error ? (
          <p className="text-sm text-destructive">{view.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={view.isInitialLoading}
            isRefreshing={view.isRefreshing}
            shimmer={<TableRowsShimmer rows={5} columns={3} />}
          >
            <Table className="enterprise-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items?.length ? (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(item.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={`Edit ${entityLabel.toLowerCase()}`}
                              onClick={() => {
                                setEditItem(item)
                                setEditName(item.name)
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={`Delete ${entityLabel.toLowerCase()}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => setDeleteItem(item)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No {entityLabel.toLowerCase()}s yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ShimmerContainer>
          )}
      </DataPanel>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setCreateName("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add {entityLabel.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Enter a unique name for the new {entityLabel.toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="create-master-name">Name</Label>
            <Input
              id="create-master-name"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={`${entityLabel} name`}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending || !createName.trim()}
            >
              {createMutation.isPending ? "Saving…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editItem)} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {entityLabel.toLowerCase()}</DialogTitle>
            <DialogDescription>Update the name for {editItem?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="edit-master-name">Name</Label>
            <Input
              id="edit-master-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveEdit()}
              disabled={
                updateMutation.isPending ||
                !editName.trim() ||
                editName.trim() === editItem?.name
              }
            >
              {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteItem)} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityLabel.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteItem?.name}. Deletion is blocked if linked to a
              procurement package.
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
    </>
  )
})
