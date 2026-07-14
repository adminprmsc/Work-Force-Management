import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import {
  Circle,
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import type { FeatureCollection } from "geojson"
import "leaflet/dist/leaflet.css"

import { responseStatusLabel } from "@/lib/survey"
import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  PAKISTAN_OVERVIEW_BOUNDS,
  PUNJAB_PROGRAM_BOUNDS,
  WFM_TEHSILS,
} from "@/lib/wfm-tehsil-map"
import type { SurveyResponse } from "@/modules/api/survey-types"

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

type PlottedResponse = SurveyResponse & {
  submittedLocation: NonNullable<SurveyResponse["submittedLocation"]>
}

type SurveyResponsesMapProps = {
  responses: SurveyResponse[]
  className?: string
  /** Smaller height when embedded in a dialog */
  compact?: boolean
  /** When set, the map flies to this submission and opens its popup */
  focusResponseId?: string | null
}

function MapViewport({
  plotted,
  punjabGeo,
}: {
  plotted: PlottedResponse[]
  punjabGeo: FeatureCollection | null
}) {
  const map = useMap()

  useEffect(() => {
    map.setMinZoom(MAP_MIN_ZOOM)
    map.setMaxBounds(L.latLngBounds(PAKISTAN_OVERVIEW_BOUNDS))

    const punjabBounds = punjabGeo
      ? L.geoJSON(punjabGeo).getBounds()
      : L.latLngBounds(PUNJAB_PROGRAM_BOUNDS)

    if (plotted.length === 0) {
      map.fitBounds(PAKISTAN_OVERVIEW_BOUNDS, {
        padding: [12, 12],
        maxZoom: MAP_MIN_ZOOM,
      })
      return
    }

    const submissionBounds = L.latLngBounds(
      plotted.map((response) => [
        response.submittedLocation.latitude,
        response.submittedLocation.longitude,
      ]),
    )
    map.fitBounds(submissionBounds.extend(punjabBounds), {
      padding: [36, 36],
      maxZoom: 11,
    })
  }, [map, plotted, punjabGeo])

  return null
}

function FocusedSubmission({
  response,
}: {
  response: PlottedResponse | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!response) return
    const { latitude, longitude } = response.submittedLocation
    map.flyTo([latitude, longitude], 14, { duration: 0.75 })
  }, [map, response])

  return null
}

function useGeoJson(path: string) {
  const [data, setData] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(path)
      .then((response) => response.json() as Promise<FeatureCollection>)
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch(() => {
        if (!cancelled) setData(null)
      })
    return () => {
      cancelled = true
    }
  }, [path])

  return data
}

function SubmissionMarker({
  response,
  tehsil,
  autoOpen,
}: {
  response: PlottedResponse
  tehsil: (typeof WFM_TEHSILS)[number] | undefined
  autoOpen: boolean
}) {
  const markerRef = useRef<L.Marker>(null)
  const site = response.settlement
    ? `${response.village.name} · ${response.settlement.name}`
    : response.village.name

  useEffect(() => {
    if (autoOpen) {
      markerRef.current?.openPopup()
    }
  }, [autoOpen, response.id])

  return (
    <Marker
      ref={markerRef}
      position={[
        response.submittedLocation.latitude,
        response.submittedLocation.longitude,
      ]}
    >
      <Popup>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{response.form.title}</p>
          <p>{site}</p>
          <p className="text-muted-foreground">{response.tehsil.name}</p>
          {tehsil ? (
            <p className="text-xs text-emerald-700">
              Inside programme tehsil boundary
            </p>
          ) : (
            <p className="text-xs text-amber-700">
              Outside highlighted programme tehsils
            </p>
          )}
          <p>{response.respondent.username}</p>
          <p>{responseStatusLabel(response.status)}</p>
          {response.submittedAt ? (
            <p className="text-xs text-muted-foreground">
              Submitted{" "}
              {format(new Date(response.submittedAt), "dd MMM yyyy HH:mm")}
            </p>
          ) : null}
          {response.submittedLocation.accuracyMeters != null ? (
            <p className="text-xs text-muted-foreground">
              ±{Math.round(response.submittedLocation.accuracyMeters)} m accuracy
            </p>
          ) : null}
        </div>
      </Popup>
    </Marker>
  )
}

export function SurveyResponsesMap({
  responses,
  className,
  compact = false,
  focusResponseId = null,
}: SurveyResponsesMapProps) {
  const pakistanGeo = useGeoJson("/geo/pakistan.geojson")
  const punjabGeo = useGeoJson("/geo/punjab.geojson")

  const plotted = useMemo(
    () =>
      responses.filter(
        (response): response is PlottedResponse => response.submittedLocation != null,
      ),
    [responses],
  )

  const tehsilByName = useMemo(() => {
    const map = new Map<string, (typeof WFM_TEHSILS)[number]>()
    for (const tehsil of WFM_TEHSILS) {
      map.set(tehsil.name, tehsil)
    }
    return map
  }, [])

  const focusedResponse = useMemo(
    () =>
      focusResponseId
        ? (plotted.find((response) => response.id === focusResponseId) ?? null)
        : null,
    [plotted, focusResponseId],
  )

  return (
    <div className={className}>
      <div className="relative">
        <MapContainer
          center={[30.2, 71.8]}
          zoom={MAP_MIN_ZOOM}
          minZoom={MAP_MIN_ZOOM}
          maxZoom={MAP_MAX_ZOOM}
          maxBounds={PAKISTAN_OVERVIEW_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          className={`z-0 w-full rounded-xl border shadow-sm ${compact ? "h-56" : "h-[28rem]"}`}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={MAP_MAX_ZOOM}
          />

          {pakistanGeo ? (
            <GeoJSON
              data={pakistanGeo}
              style={() => ({
                color: "#64748b",
                weight: 1.25,
                fillColor: "#f8fafc",
                fillOpacity: 0.15,
                dashArray: "5 4",
              })}
            />
          ) : null}

          {punjabGeo ? (
            <GeoJSON
              data={punjabGeo}
              style={() => ({
                color: "#0d3a6b",
                weight: 2.5,
                fillColor: "#0d3a6b",
                fillOpacity: 0.1,
              })}
            />
          ) : null}

          {WFM_TEHSILS.map((tehsil) => (
            <Circle
              key={tehsil.name}
              center={[tehsil.lat, tehsil.lon]}
              radius={tehsil.radiusMeters}
              pathOptions={{
                color: "#059669",
                weight: 1.5,
                fillColor: "#10b981",
                fillOpacity: 0.14,
              }}
            >
              <Tooltip
                permanent
                direction="center"
                className="!border-0 !bg-transparent !shadow-none"
              >
                <span className="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900 shadow-sm">
                  {tehsil.name}
                </span>
              </Tooltip>
            </Circle>
          ))}

          {plotted.map((response) => (
            <SubmissionMarker
              key={response.id}
              response={response}
              tehsil={tehsilByName.get(response.tehsil.name.toUpperCase())}
              autoOpen={response.id === focusResponseId}
            />
          ))}

          <MapViewport plotted={plotted} punjabGeo={punjabGeo} />
          <FocusedSubmission response={focusedResponse} />
        </MapContainer>

        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] max-w-[14rem] rounded-lg border bg-white/95 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
          <p className="font-semibold text-foreground">Map legend</p>
          <ul className="mt-1.5 space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-4 rounded border border-slate-400 bg-slate-50" />
              Pakistan
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-4 rounded border-2 border-[#0d3a6b] bg-[#0d3a6b]/10" />
              Punjab
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-4 rounded-full border border-emerald-600 bg-emerald-500/20" />
              Programme tehsil
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-block h-3 w-2 bg-[url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png')] bg-contain bg-no-repeat" />
              GPS submission
            </li>
          </ul>
        </div>
      </div>

      {plotted.length === 0 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          No GPS-tagged submissions yet. Pins will appear when tehsil RAs submit with live
          location enabled.
        </p>
      ) : null}
    </div>
  )
}
