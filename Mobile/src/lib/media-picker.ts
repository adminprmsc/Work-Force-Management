import { Alert, NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import type {
  Asset,
  CameraOptions,
  ImageLibraryOptions,
  ImagePickerResponse,
} from 'react-native-image-picker';

type NativeImagePickerModule = {
  launchCamera: (
    options: CameraOptions,
    callback: (result: ImagePickerResponse) => void,
  ) => void;
  launchImageLibrary: (
    options: ImageLibraryOptions,
    callback: (result: ImagePickerResponse) => void,
  ) => void;
};

const DEFAULT_OPTIONS: ImageLibraryOptions & CameraOptions = {
  mediaType: 'photo',
  videoQuality: 'high',
  quality: 1,
  maxWidth: 0,
  maxHeight: 0,
  includeBase64: false,
  cameraType: 'back',
  selectionLimit: 1,
  saveToPhotos: false,
  durationLimit: 0,
  includeExtra: false,
  presentationStyle: 'pageSheet',
  assetRepresentationMode: 'auto',
};

/** Resolve at call time — react-native-image-picker caches null if loaded before native link. */
function getNativeImagePicker(): NativeImagePickerModule | null {
  // @ts-expect-error RN global
  const isTurboModuleEnabled = global.__turboModuleProxy != null;
  if (isTurboModuleEnabled) {
    return TurboModuleRegistry.get('ImagePicker') as NativeImagePickerModule | null;
  }
  return NativeModules.ImagePicker ?? null;
}

function rebuildInstructions(): string {
  if (Platform.OS === 'ios') {
    return 'Run pod install and rebuild the app:\n\ncd Mobile/ios && pod install\ncd .. && npm run ios';
  }
  return 'Rebuild the app after installing native modules:\n\ncd Mobile && npm run android';
}

export function ensureImagePickerAvailable(): boolean {
  if (getNativeImagePicker() != null) return true;
  Alert.alert('Photo picker unavailable', rebuildInstructions());
  return false;
}

function handlePickerResponse(response: ImagePickerResponse): Asset | null {
  if (response.didCancel) return null;
  if (response.errorCode || response.errorMessage) {
    Alert.alert(
      'Could not open picker',
      response.errorMessage ?? response.errorCode ?? 'Unknown error',
    );
    return null;
  }
  return response.assets?.[0] ?? null;
}

function invokeNativePicker<T extends ImageLibraryOptions | CameraOptions>(
  method: 'launchImageLibrary' | 'launchCamera',
  options: T,
): Promise<ImagePickerResponse> {
  const native = getNativeImagePicker();
  if (native == null) {
    return Promise.reject(
      new Error('Image picker native module is not linked. Rebuild the app.'),
    );
  }

  return new Promise((resolve, reject) => {
    try {
      native[method]({ ...DEFAULT_OPTIONS, ...options }, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

export async function pickFromLibrary(
  options: ImageLibraryOptions,
): Promise<Asset | null> {
  if (!ensureImagePickerAvailable()) return null;
  try {
    const response = await invokeNativePicker('launchImageLibrary', options);
    return handlePickerResponse(response);
  } catch (error) {
    Alert.alert(
      'Could not open gallery',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

export async function pickFromCamera(
  options: CameraOptions,
): Promise<Asset | null> {
  if (!ensureImagePickerAvailable()) return null;
  try {
    const response = await invokeNativePicker('launchCamera', options);
    return handlePickerResponse(response);
  } catch (error) {
    Alert.alert(
      'Could not open camera',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}

export function assetFileName(asset: Asset, fallback: string): string {
  if (asset.fileName?.trim()) return asset.fileName;
  if (asset.uri) {
    const parts = asset.uri.split('/');
    const last = parts[parts.length - 1];
    if (last?.includes('.')) return last;
  }
  return fallback;
}
