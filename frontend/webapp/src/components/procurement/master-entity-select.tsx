import { memo, useCallback, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

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
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const CREATE_NEW_VALUE = "__create_new__"

type MasterEntitySelectProps = {
  id: string
  label: string
  placeholder: string
  entityLabel: string
  value: string
  onValueChange: (value: string) => void
  items: Array<{ id: string; name: string }> | undefined
  onCreate: (name: string) => Promise<{ id: string }>
  isCreating?: boolean
}

export const MasterEntitySelect = memo(function MasterEntitySelect({
  id,
  label,
  placeholder,
  entityLabel,
  value,
  onValueChange,
  items,
  onCreate,
  isCreating = false,
}: MasterEntitySelectProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState("")

  const handleSelect = useCallback(
    (next: string) => {
      if (next === CREATE_NEW_VALUE) {
        setCreateOpen(true)
        return
      }
      onValueChange(next)
    },
    [onValueChange],
  )

  const handleCreate = useCallback(async () => {
    const name = createName.trim()
    if (!name) return

    try {
      const created = await onCreate(name)
      onValueChange(created.id)
      setCreateOpen(false)
      setCreateName("")
      toast.success(`${entityLabel} created`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to create ${entityLabel.toLowerCase()}`)
    }
  }, [createName, entityLabel, onCreate, onValueChange])

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={id}>{label}</Label>
        <Select value={value || undefined} onValueChange={handleSelect}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {items?.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value={CREATE_NEW_VALUE} className="text-primary">
              <span className="flex items-center gap-2">
                <Plus className="size-4" />
                Create new {entityLabel.toLowerCase()}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) setCreateName("")
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create {entityLabel.toLowerCase()}</DialogTitle>
            <DialogDescription>
              Add a new {entityLabel.toLowerCase()} and select it for this package.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor={`${id}-quick-create-name`}>Name</Label>
            <Input
              id={`${id}-quick-create-name`}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder={`${entityLabel} name`}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleCreate()}
              disabled={isCreating || !createName.trim()}
            >
              {isCreating ? "Creating…" : `Create ${entityLabel.toLowerCase()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})
