import { useEffect, useMemo, useRef, useState } from "react"
import { CirclePlay, Plus, RotateCcw, Search, SlidersHorizontal, Trash2 } from "lucide-react"

import { useDashboardColorGrade } from "@/components/survey/use-dashboard-color-grade"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  canAddColorSection,
  canRemoveColorSection,
  type ColorSection,
  type ColorSeries,
  type ColorSeriesGroup,
} from "@/lib/dashboard-color-grade"
import { cn } from "@/lib/utils"

const GROUPS: { id: ColorSeriesGroup; title: string; noun: string }[] = [
  { id: "tehsil", title: "Tehsils", noun: "tehsils" },
  { id: "village", title: "Villages", noun: "villages" },
  { id: "choice", title: "Answers", noun: "answers" },
]

export function ColorReportSheetButton() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <SlidersHorizontal />
          Chart colors
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Chart colors</SheetTitle>
          <SheetDescription>
            Pick a color, then move tehsils, villages, and answers into it. Hide a color to take it off the charts.
          </SheetDescription>
        </SheetHeader>
        <DashboardColorGradePanel reserveClose />
      </SheetContent>
    </Sheet>
  )
}

export function ColorReportRail() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-5.5rem)] xl:block">
      <DashboardColorGradePanel />
    </aside>
  )
}

function DashboardColorGradePanel({ reserveClose = false }: { reserveClose?: boolean }) {
  const grade = useDashboardColorGrade()
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState<ColorSeriesGroup>("tehsil")
  const [activeId, setActiveId] = useState<string | null>(null)
  const previousCount = useRef(grade.sections.length)

  useEffect(() => {
    if (grade.sections.length > previousCount.current) {
      setActiveId(grade.sections[grade.sections.length - 1]?.id ?? null)
    }
    previousCount.current = grade.sections.length
  }, [grade.sections])

  const active = grade.sections.find((section) => section.id === activeId) ?? grade.sections[0]

  const usage = useMemo(() => {
    const map = new Map<string, { tehsil: number; village: number; choice: number }>()
    for (const section of grade.sections) {
      map.set(section.id, { tehsil: 0, village: 0, choice: 0 })
    }
    for (const item of grade.catalog) {
      const bucket = map.get(grade.paint(item.key).sectionId)
      if (bucket) bucket[item.group] += 1
    }
    return map
  }, [grade])

  const showing = grade.sections
    .filter((section) => section.enabled)
    .map((section) => section.label.trim() || "Color")
  const activeGroup = GROUPS.find((entry) => entry.id === group) ?? GROUPS[0]!
  const activeItems = grade.catalog.filter((item) => item.group === group)

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-card xl:rounded-xl xl:border xl:shadow-sm",
        reserveClose && "pt-1",
      )}
    >
      <header className={cn("shrink-0 space-y-3 border-b px-4 py-3", reserveClose && "pr-12")}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight">Chart colors</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {grade.layout === "combined"
                ? showing.length > 0
                  ? `Shared charts are using ${joinNames(showing)}.`
                  : "Shared charts are empty because every color is hidden."
                : showing.length > 0
                  ? `Each of these gets its own chart: ${joinNames(showing)}.`
                  : "There is no split chart because every color is hidden."}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <ChartColorsGuide />
            <Button type="button" variant="ghost" size="xs" onClick={grade.reset}>
              <RotateCcw />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <ArrangementButton
            pressed={grade.layout === "combined"}
            label="Shared charts"
            hint="Colors together"
            onClick={() => grade.setLayout("combined")}
          />
          <ArrangementButton
            pressed={grade.layout === "by-section"}
            label="Split by color"
            hint="One chart each"
            onClick={() => grade.setLayout("by-section")}
          />
        </div>
      </header>

      <section className="shrink-0 space-y-3 border-b px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {grade.sections.map((section) => {
            const name = section.label.trim() || "Color"
            const selected = section.id === active?.id
            return (
              <button
                key={section.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setActiveId(section.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                  selected && "ring-2 ring-foreground ring-offset-1 ring-offset-background",
                  !section.enabled && "opacity-45",
                )}
              >
                <span className="size-2.5 rounded-full" style={{ backgroundColor: section.color }} />
                {name}
                {section.enabled ? null : <span className="text-[10px] font-normal">off</span>}
              </button>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-full px-2.5"
            disabled={!canAddColorSection(grade.sections)}
            onClick={grade.addSection}
          >
            <Plus />
            Add
          </Button>
        </div>
        {active ? (
          <ActiveColorEditor
            section={active}
            usage={usage.get(active.id) ?? { tehsil: 0, village: 0, choice: 0 }}
            canRemove={canRemoveColorSection(grade.sections)}
          />
        ) : null}
      </section>

      <section className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Tabs
          value={group}
          onValueChange={(value) => {
            setGroup(value as ColorSeriesGroup)
            setQuery("")
          }}
          className="flex min-h-0 flex-1 flex-col gap-0"
        >
          <div className="shrink-0 px-4 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Move {activeGroup.noun} into {active ? active.label.trim() || "this color" : "a color"}
            </p>
            <TabsList className="w-full">
              {GROUPS.map((entry) => (
                <TabsTrigger key={entry.id} value={entry.id} className="flex-1">
                  {entry.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {GROUPS.map((entry) => (
            <TabsContent
              key={entry.id}
              value={entry.id}
              className="mt-0 flex min-h-0 flex-1 flex-col px-4 pt-3 pb-3"
            >
              {active ? (
                <ItemList
                  items={entry.id === group ? activeItems : []}
                  noun={entry.noun}
                  section={active}
                  query={query}
                  onQueryChange={setQuery}
                  emptyLabel={`No ${entry.noun} in this filter.`}
                />
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </section>
    </div>
  )
}

const CHART_COLOR_GUIDES = [
  {
    id: "en",
    label: "English",
    src: "/guides/chart-colors-en.mp4",
  },
  {
    id: "hinglish",
    label: "Hinglish",
    src: "/guides/chart-colors-hinglish.mp4",
  },
] as const

function ChartColorsGuide() {
  const [language, setLanguage] = useState<(typeof CHART_COLOR_GUIDES)[number]["id"]>("en")
  const guide = CHART_COLOR_GUIDES.find((entry) => entry.id === language) ?? CHART_COLOR_GUIDES[0]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="xs">
          <CirclePlay />
          How to
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="pr-8">
          <DialogTitle>How chart colors work</DialogTitle>
          <DialogDescription>
            Pick a color, move tehsils, villages, and answers into it, then show or hide that color on the charts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          {CHART_COLOR_GUIDES.map((entry) => (
            <Button
              key={entry.id}
              type="button"
              size="sm"
              variant={entry.id === language ? "secondary" : "ghost"}
              aria-pressed={entry.id === language}
              onClick={() => setLanguage(entry.id)}
            >
              {entry.label}
            </Button>
          ))}
        </div>
        <video
          key={guide.src}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full rounded-lg bg-black"
          src={guide.src}
        />
      </DialogContent>
    </Dialog>
  )
}

function ArrangementButton({
  pressed,
  label,
  hint,
  onClick,
}: {
  pressed: boolean
  label: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-md px-2 py-1.5 text-left transition-colors",
        pressed ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className="block text-xs font-medium">{label}</span>
      <span className="block text-[10px] text-muted-foreground">{hint}</span>
    </button>
  )
}

function ActiveColorEditor({
  section,
  usage,
  canRemove,
}: {
  section: ColorSection
  usage: { tehsil: number; village: number; choice: number }
  canRemove: boolean
}) {
  const grade = useDashboardColorGrade()
  const name = section.label.trim() || "Color"
  const summary = [
    countPhrase(usage.tehsil, "tehsil", "tehsils"),
    countPhrase(usage.village, "village", "villages"),
    countPhrase(usage.choice, "answer", "answers"),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className={cn("rounded-lg border bg-background px-2.5 py-2", !section.enabled && "opacity-80")}>
      <div className="flex items-center gap-2">
        <label
          className="relative size-5 shrink-0 overflow-hidden rounded-full border"
          style={{ backgroundColor: section.color }}
        >
          <input
            type="color"
            value={section.color}
            aria-label={`Change the shade of ${name}`}
            onChange={(event) => grade.setSectionColor(section.id, event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <Input
          value={section.label}
          maxLength={24}
          aria-label={`Name for ${name}`}
          onChange={(event) => grade.setSectionLabel(section.id, event.target.value)}
          className="h-7 min-w-0 flex-1 px-2 text-sm"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Remove ${name}`}
          disabled={!canRemove}
          onClick={() => grade.removeSection(section.id)}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2 pl-7">
        <p className="min-w-0 truncate text-[11px] text-muted-foreground">
          {section.enabled
            ? summary || "Nothing is in this color yet"
            : "Hidden, so these items stay off the charts"}
        </p>
        <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium">
          {section.enabled ? "Showing" : "Hidden"}
          <Switch
            size="sm"
            checked={section.enabled}
            aria-label={section.enabled ? `Hide ${name}` : `Show ${name}`}
            onCheckedChange={(checked) => grade.setSectionEnabled(section.id, checked)}
          />
        </label>
      </div>
    </div>
  )
}

function ItemList({
  items,
  noun,
  section,
  query,
  onQueryChange,
  emptyLabel,
}: {
  items: ColorSeries[]
  noun: string
  section: ColorSection
  query: string
  onQueryChange: (value: string) => void
  emptyLabel: string
}) {
  const grade = useDashboardColorGrade()
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? items.filter((item) =>
        `${item.label} ${item.detail ?? ""} ${item.groupLabel}`.toLowerCase().includes(needle),
      )
    : items
  const grouped = groupByLabel(visible)
  const targets = needle ? visible : items
  const name = section.label.trim() || "Color"

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`Find ${noun}`}
            aria-label={`Find ${noun}`}
            className="h-8 pl-8"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full"
          onClick={() => grade.assignMany(targets.map((item) => item.key), section.id)}
        >
          Move all here
        </Button>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing matches that search.</p>
      ) : (
        <div className="rounded-lg border">
          <div className="space-y-3 px-2.5 py-2">
            {grouped.map((group) => (
              <div key={group.label} className="space-y-1">
                {items[0]?.group === "choice" ? (
                  <p className="truncate pt-1 text-[11px] font-semibold text-muted-foreground">{group.label}</p>
                ) : null}
                {group.items.map((item) => {
                  const painted = grade.paint(item.key)
                  const here = painted.sectionId === section.id
                  return (
                    <div key={item.key} className="flex items-center gap-2 py-1">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: painted.color }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{item.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {[
                            item.detail,
                            `${here ? `In ${name}` : `In ${painted.sectionLabel}`}${painted.visible ? "" : ", hidden"}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {item.value.toLocaleString()}
                      </span>
                      <Button
                        type="button"
                        variant={here ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 shrink-0 px-2"
                        disabled={here}
                        onClick={() => grade.assign(item.key, section.id)}
                      >
                        {here ? "Here" : "Move here"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function groupByLabel(items: ColorSeries[]) {
  const groups: { label: string; items: ColorSeries[] }[] = []
  for (const item of items) {
    const current = groups[groups.length - 1]
    if (current && current.label === item.groupLabel) {
      current.items.push(item)
    } else {
      groups.push({ label: item.groupLabel, items: [item] })
    }
  }
  return groups
}

function countPhrase(count: number, singular: string, plural: string) {
  if (count <= 0) return null
  return `${count} ${count === 1 ? singular : plural}`
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? ""
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
}
