import { Platform } from 'react-native';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

const DEFAULT_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});

const DEFAULT_API_BASE_URL = `http://${DEFAULT_HOST}:3001/api`;

export function apiBaseUrl(): string {
  return ENV_API_BASE_URL ?? DEFAULT_API_BASE_URL;
}

/** Error carrying the HTTP status so callers can react (e.g. 409 conflicts). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** True when the failure is a server-side conflict (e.g. duplicate submission). */
export function isConflictError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 409;
}

async function parseError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) return `Request failed (${res.status})`;

  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (json.message) {
      return Array.isArray(json.message) ? json.message.join(', ') : json.message;
    }
  } catch {
    // fall through
  }

  return text;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const url = `${apiBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        ...(rest.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    throw new Error(
      `Cannot reach API at ${url}. Check API_BASE_URL in .env, device network, and HTTP/HTTPS settings.${detail}`,
    );
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function apiFormDataRequest<T>(
  path: string,
  formData: FormData,
  init: { token?: string } = {},
): Promise<T> {
  const { token } = init;
  const url = `${apiBaseUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    throw new Error(
      `Cannot reach API at ${url}. Check API_BASE_URL in .env, device network, and HTTP/HTTPS settings.${detail}`,
    );
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  return res.json() as Promise<T>;
}
