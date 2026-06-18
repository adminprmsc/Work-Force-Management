import { memo, useMemo, useState } from "react"
import { CheckCircle2, MapPin } from "lucide-react"

import {
  ListItemsShimmer,
  SelectFieldShimmer,
  ShimmerContainer,
} from "@/components/common/query-shimmer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useSettlementsQuery, useTehsilsQuery, useVillagesQuery } from "@/hooks/api"
import type { Settlement, Tehsil, Village } from "@/modules/api/types"
import { getQueryViewState } from "@/lib/query-view-state"

const VillageListButton = memo(function VillageListButton({
  village,
  active,
  onSelect,
}: {
  village: Village
  active: boolean
  onSelect: (id: string) => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      className="h-auto w-full justify-between px-3 py-2"
      onClick={() => onSelect(village.id)}
    >
      <span className="truncate text-left">
        {village.name}
        {active ? (
          <span className="ml-2 inline-flex items-center text-xs text-muted-foreground">
            <CheckCircle2 className="mr-1 size-3" />
            Selected
          </span>
        ) : null}
      </span>
      <Badge variant="outline">{village.settlementCount}</Badge>
    </Button>
  )
})

export const TehsilExplorer = memo(function TehsilExplorer() {
  const tehsilsQuery = useTehsilsQuery()
  const tehsilsView = useMemo(() => getQueryViewState<Tehsil[]>(tehsilsQuery), [tehsilsQuery])
  const tehsils = tehsilsView.data

  const [selectedTehsilId, setSelectedTehsilId] = useState<string | null>(null)
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null)

  const activeTehsilId = selectedTehsilId ?? tehsils?.[0]?.id ?? null
  const villagesQuery = useVillagesQuery(activeTehsilId)
  const villagesView = useMemo(() => getQueryViewState<Village[]>(villagesQuery), [villagesQuery])
  const villages = villagesView.data

  const selectedTehsil = tehsils?.find((t) => t.id === activeTehsilId)
  const activeVillageId = selectedVillageId ?? villages?.[0]?.id ?? null
  const selectedVillage = villages?.find((v) => v.id === activeVillageId) ?? null

  const settlementsQuery = useSettlementsQuery(activeVillageId)
  const settlementsView = useMemo(
    () => getQueryViewState<Settlement[]>(settlementsQuery),
    [settlementsQuery],
  )

  const settlementNames = useMemo(() => {
    return settlementsView.data?.map((s) => s.name) ?? []
  }, [settlementsView.data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tehsil geography</CardTitle>
        <CardDescription>Browse tehsils and their villages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tehsilsView.error ? (
          <p className="text-sm text-destructive">{tehsilsView.error}</p>
        ) : (
          <ShimmerContainer
            isInitialLoading={tehsilsView.isInitialLoading}
            isRefreshing={tehsilsView.isRefreshing}
            shimmer={<SelectFieldShimmer />}
          >
            {tehsils?.length ? (
              <Select value={activeTehsilId ?? undefined} onValueChange={setSelectedTehsilId}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select tehsil" />
                </SelectTrigger>
                <SelectContent>
                  {tehsils.map((tehsil) => (
                    <SelectItem key={tehsil.id} value={tehsil.id}>
                      {tehsil.name} ({tehsil.villageCount} villages)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>No tehsils available</EmptyTitle>
                  <EmptyDescription>Geography data has not been seeded yet.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </ShimmerContainer>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="mb-2 text-sm text-muted-foreground">
              {selectedTehsil ? (
                <>
                  Villages in{" "}
                  <span className="font-medium text-foreground">{selectedTehsil.name}</span>
                </>
              ) : (
                "Villages"
              )}
            </div>

            {villagesView.error ? (
              <p className="text-sm text-destructive">{villagesView.error}</p>
            ) : (
              <ShimmerContainer
                isInitialLoading={Boolean(activeTehsilId) && villagesView.isInitialLoading}
                isRefreshing={villagesView.isRefreshing}
                shimmer={<ListItemsShimmer items={6} />}
              >
                {villages?.length ? (
                  <div className="rounded-xl border">
                    <ScrollArea className="h-[340px]">
                      <div className="p-2">
                        {villages.map((village) => (
                          <VillageListButton
                            key={village.id}
                            village={village}
                            active={village.id === activeVillageId}
                            onSelect={setSelectedVillageId}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : activeTehsilId ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No villages found</EmptyTitle>
                      <EmptyDescription>This tehsil has no villages in the system.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : null}
              </ShimmerContainer>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="mb-2 text-sm text-muted-foreground">Village details</div>
            {selectedVillage ? (
              <div className="rounded-xl border">
                <div className="space-y-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">{selectedVillage.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedTehsil?.name ? `${selectedTehsil.name} • ` : ""}
                        {selectedVillage.settlementCount} settlements
                      </div>
                    </div>
                    <Badge variant="secondary">Village</Badge>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Settlements</div>
                    {settlementsView.error ? (
                      <p className="text-sm text-destructive">{settlementsView.error}</p>
                    ) : (
                      <ShimmerContainer
                        isInitialLoading={
                          Boolean(activeVillageId) && settlementsView.isInitialLoading
                        }
                        isRefreshing={settlementsView.isRefreshing}
                        shimmer={<ListItemsShimmer items={5} />}
                      >
                        {settlementNames.length ? (
                          <div className="rounded-lg border bg-muted/20">
                            <ScrollArea className="h-[220px]">
                              <ul className="space-y-1 p-3 text-sm">
                                {settlementNames.map((name) => (
                                  <li key={name} className="flex items-center justify-between">
                                    <span className="truncate">{name}</span>
                                  </li>
                                ))}
                              </ul>
                            </ScrollArea>
                          </div>
                        ) : (
                          <Empty>
                            <EmptyHeader>
                              <EmptyTitle>No settlements found</EmptyTitle>
                              <EmptyDescription>
                                This village has no settlements in the system.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        )}
                      </ShimmerContainer>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>Select a village</EmptyTitle>
                  <EmptyDescription>
                    Choose a village from the left to view its settlements.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
