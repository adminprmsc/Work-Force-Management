/** WFM programme tehsils — keep in sync with backend/prisma/data/location-data.ts */
export const WFM_TEHSILS = [
  { name: "AHMADPUR SIAL", lat: 30.808, lon: 71.874, radiusMeters: 22_000 },
  { name: "ALIPUR", lat: 29.278, lon: 70.757, radiusMeters: 24_000 },
  { name: "BAHAWALNAGAR", lat: 29.799, lon: 73.197, radiusMeters: 26_000 },
  { name: "BHOWANA", lat: 31.532, lon: 72.678, radiusMeters: 20_000 },
  { name: "DARYA KHAN", lat: 31.811, lon: 71.331, radiusMeters: 20_000 },
  { name: "ISA KHEL", lat: 32.85, lon: 71.33, radiusMeters: 22_000 },
  { name: "KAHROR PACCA", lat: 29.638, lon: 71.91, radiusMeters: 20_000 },
  { name: "KALLAR KAHAR", lat: 32.76, lon: 72.674, radiusMeters: 18_000 },
  { name: "KHAIRPUR TAMEWALI", lat: 29.611, lon: 72.257, radiusMeters: 20_000 },
  { name: "KOT MOMIN", lat: 32.096, lon: 73.11, radiusMeters: 22_000 },
  { name: "LIAQATPUR", lat: 28.485, lon: 70.836, radiusMeters: 24_000 },
  { name: "NOORPUR THAL", lat: 31.872, lon: 71.96, radiusMeters: 28_000 },
  { name: "PAKPATTAN", lat: 30.343, lon: 73.445, radiusMeters: 24_000 },
  { name: "ROJHAN", lat: 28.778, lon: 70.036, radiusMeters: 26_000 },
  { name: "SHUJABAD", lat: 29.825, lon: 71.313, radiusMeters: 20_000 },
  { name: "TAUNSA", lat: 30.901, lon: 70.612, radiusMeters: 24_000 },
] as const

/** Default map view — southern & central Punjab programme area */
export const PUNJAB_PROGRAM_BOUNDS: [[number, number], [number, number]] = [
  [27.9, 69.8],
  [33.2, 74.0],
]

/** Pakistan country overview when framing Punjab in context */
export const PAKISTAN_OVERVIEW_BOUNDS: [[number, number], [number, number]] = [
  [23.5, 60.5],
  [37.5, 78.5],
]

/** Users can zoom in for village detail but not out past the default overview */
export const MAP_MIN_ZOOM = 6

export const MAP_MAX_ZOOM = 16
