import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'wfm.mobile.auth.token';

export async function getStoredToken(): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({ service: TOKEN_SERVICE });
  if (!credentials) return null;
  return credentials.password;
}

export async function setStoredToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('token', token, { service: TOKEN_SERVICE });
}

export async function clearStoredToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: TOKEN_SERVICE });
}
