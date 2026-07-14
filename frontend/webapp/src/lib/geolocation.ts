export type SubmissionLocationReading = {
  latitude: number
  longitude: number
  accuracyMeters?: number
}

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GeolocationError"
  }
}

export function getSubmissionLocation(): Promise<SubmissionLocationReading> {
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
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 0,
      },
    )
  })
}
