export type SubmissionLocationReading = {
  latitude: number
  accuracyMeters?: number
  longitude: number
}

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GeolocationError"
  }
}

function readPosition(options: PositionOptions): Promise<SubmissionLocationReading> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new GeolocationError("This device does not support GPS location"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        })
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location permission is required to submit a site visit"
            : error.code === error.POSITION_UNAVAILABLE
              ? "Could not determine your current location"
              : error.code === error.TIMEOUT
                ? "Timed out while waiting for GPS location"
                : "Failed to capture GPS location"
        reject(new GeolocationError(message))
      },
      options,
    )
  })
}

/** High-accuracy first, then a longer low-accuracy pass for weaker GPS. */
export async function getSubmissionLocation(): Promise<SubmissionLocationReading> {
  try {
    return await readPosition({
      enableHighAccuracy: true,
      timeout: 35_000,
      maximumAge: 15_000,
    })
  } catch (firstError) {
    if (
      firstError instanceof GeolocationError &&
      firstError.message.includes("permission")
    ) {
      throw firstError
    }
    try {
      return await readPosition({
        enableHighAccuracy: false,
        timeout: 45_000,
        maximumAge: 60_000,
      })
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new GeolocationError("Timed out while waiting for GPS location")
    }
  }
}
