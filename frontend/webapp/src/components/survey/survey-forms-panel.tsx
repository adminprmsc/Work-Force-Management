import { useState } from "react"
import { format } from "date-fns"
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Send,
  Archive,
  Trash2,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

import { DataPanel } from "@/components/common/data-panel"
import {
  ShimmerContainer,
  TableRowsShimmer,
} from "@/components/common/query-shimmer"
import { SurveyAssignDialog } from "@/components/survey/survey-assign-dialog"
import { SurveyFormDesigner } from "@/components/survey/survey-form-designer"
import { SurveyFormPreview } from "@/components/survey/survey-form-preview"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useArchiveSurveyFormMutation,
  useDeleteSurveyFormMutation,
  usePublishSurveyFormMutation,
  useSurveyFormsQuery,
} from "@/hooks/api/survey-hooks"
import { getQueryViewState } from "@/lib/query-view-state"
import { statusBadgeVariant, statusLabel } from "@/lib/survey"
import type { SurveyForm } from "@/modules/api/survey-types"

export function SurveyFormsPanel() {
  const query = useSurveyFormsQuery()
  const view = getQueryViewState<SurveyForm[]>(query)
  const forms = view.data ?? []

  const publishMutation = usePublishSurveyFormMutation()
  const archiveMutation = useArchiveSurveyFormMutation()
  const deleteMutation = useDeleteSurveyFormMutation()

  const [designerOpen, setDesignerOpen] = useState(false)
  const [designerForm, setDesignerForm] = useState<SurveyForm | null>(null)
  const [assignForm, setAssignForm] = useState<SurveyForm | null>(null)
  const [previewForm, setPreviewForm] = useState<SurveyForm | null>(null)
  const [deleteForm, setDeleteForm] = useState<SurveyForm | null>(null)

  const openCreate = () => {
    setDesignerForm(null)
    setDesignerOpen(true)
  }
  const openEdit = (form: SurveyForm) => {
    setDesignerForm(form)
    setDesignerOpen(true)
  }

  const handlePublish = async (form: SurveyForm) => {
    try {
      await publishMutation.mutateAsync(form.id)
      toast.success(form.status === "ARCHIVED" ? "Form republished" : "Form published")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish")
    }
  }

  const handleArchive = async (form: SurveyForm) => {
    try {
      await archiveMutation.mutateAsync(form.id)
      toast.success("Form archived")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to archive")
    }
  }

  const handleDelete = async () => {
    if (!deleteForm) return
    try {
      await deleteMutation.mutateAsync(deleteForm.id)
      toast.success("Form deleted")
      setDeleteForm(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  return (
    <>
      <DataPanel
        title="Survey forms"
        description="Design questionnaires, publish them, and assign them to procurement packages."
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 size-4" />
            New form
          </Button>
        }
      >
        {view.error ? (
          <p className="text-sm text-destructive">{view.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={view.isInitialLoading}
            isRefreshing={view.isRefreshing}
            shimmer={<TableRowsShimmer rows={5} columns={5} />}
          >
            <Table className="enterprise-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Fields</TableHead>
                  <TableHead className="text-center">Assignments</TableHead>
                  <TableHead className="text-center">Responses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.length ? (
                  forms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        <div className="font-medium">{form.title}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {form.requiresPackageBaseline ? (
                            <Badge
                              variant="outline"
                              className="border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                            >
                              Village monitoring
                            </Badge>
                          ) : null}
                          <span className="text-xs text-muted-foreground">
                            Updated {format(new Date(form.updatedAt), "dd MMM yyyy")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(form.status)}>
                          {statusLabel(form.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{form.fields.length}</TableCell>
                      <TableCell className="text-center">
                        {form.assignmentCount}
                      </TableCell>
                      <TableCell className="text-center">{form.responseCount}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewForm(form)}>
                              <Eye className="mr-2 size-4" />
                              Preview
                            </DropdownMenuItem>
                            {form.status === "DRAFT" || form.status === "ARCHIVED" ? (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(form)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handlePublish(form)}
                                >
                                  <Upload className="mr-2 size-4" />
                                  {form.status === "ARCHIVED" ? "Republish" : "Publish"}
                                </DropdownMenuItem>
                              </>
                            ) : null}
                            {form.status === "PUBLISHED" ? (
                              <>
                                <DropdownMenuItem onClick={() => openEdit(form)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit name & description
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAssignForm(form)}>
                                  <Send className="mr-2 size-4" />
                                  Assign
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => void handleArchive(form)}
                                >
                                  <Archive className="mr-2 size-4" />
                                  Archive
                                </DropdownMenuItem>
                              </>
                            ) : null}
                            {form.status !== "PUBLISHED" ? (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleteForm(form)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No survey forms yet. Create your first form.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ShimmerContainer>
        )}
      </DataPanel>

      {designerOpen ? (
        <SurveyFormDesigner
          key={designerForm?.id ?? "new"}
          open
          onOpenChange={setDesignerOpen}
          form={designerForm}
          fieldsLocked={designerForm?.status === "PUBLISHED"}
        />
      ) : null}

      {assignForm ? (
        <SurveyAssignDialog
          key={assignForm.id}
          open
          onOpenChange={(open) => !open && setAssignForm(null)}
          form={assignForm}
        />
      ) : null}

      <SurveyFormPreview
        open={Boolean(previewForm)}
        onOpenChange={(open) => !open && setPreviewForm(null)}
        form={previewForm}
      />

      <AlertDialog
        open={Boolean(deleteForm)}
        onOpenChange={(open) => !open && setDeleteForm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleteForm?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the form. Forms with responses cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
