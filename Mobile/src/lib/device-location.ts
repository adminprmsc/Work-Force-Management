import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

export type SubmissionLocationReading = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export class GeolocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeolocationError';
  }
}

async function requestAndroidPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location required',
      message: 'We need your live GPS location to verify you submitted from the visit site.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getSubmissionLocation(): Promise<SubmissionLocationReading> {
  if (Platform.OS === 'android') {
    const allowed = await requestAndroidPermission();
    if (!allowed) {
      throw new GeolocationError('Location permission is required to submit a site visit');
    }
  }

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy,
        });
      },
      (error) => {
        const message =
          error.code === 1
            ? 'Location permission is required to submit a site visit'
            : error.code === 2
              ? 'Could not determine your current location'
              : error.code === 3
                ? 'Timed out while waiting for GPS location'
                : 'Failed to capture GPS location';
        reject(new GeolocationError(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 20_000,
        maximumAge: 0,
      },
    );
  });
}
