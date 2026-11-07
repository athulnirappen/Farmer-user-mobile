import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthStart, Session } from './types';

// 10.0.2.2 is this PC as seen from the Android emulator. A real phone needs the PC's Wi-Fi IP,
// set through EXPO_PUBLIC_API_ORIGIN in .env.local.
export const API_ORIGIN =
  process.env.EXPO_PUBLIC_API_ORIGIN ??
  (Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000');
const API_URL = `${API_ORIGIN}/api/v1`;

// Hosted images are absolute (Supabase Storage); locally stored ones are relative to the API
export const imageUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`);

const REFRESH_TOKEN_KEY = 'farmer.refreshToken';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  // Sent as multipart; the boundary in its Content-Type is set by fetch
  form?: FormData;
  query?: Record<string, string | number | undefined>;
};

// The access token stays in memory; only the refresh token survives a restart
let accessToken: string | null = null;
let refreshInFlight: Promise<Session> | null = null;
let onSessionLost = () => {};

export const setSessionLostHandler = (handler: () => void) => {
  onSessionLost = handler;
};

export const hasStoredSession = async () =>
  (await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)) !== null;

const clearSession = async () => {
  accessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};

const storeSession = async (session: Session) => {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);
  accessToken = session.accessToken;
  return session;
};

const parse = async <T>(response: Response): Promise<T> => {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `Request failed (${response.status})`, response.status);
  }

  return payload.data as T;
};

const send = (path: string, { method = 'GET', body, form, query }: RequestOptions = {}) => {
  // The API rejects empty filters, so blank values are left out
  const params = Object.entries(query ?? {})
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');

  return fetch(`${API_URL}${path}${params && `?${params}`}`, {
    method,
    headers: {
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
  });
};

// A refresh token works once, and replaying a used one signs the user out everywhere.
// So concurrent requests all wait on the same refresh.
const refreshSession = (): Promise<Session> => {
  refreshInFlight ??= (async () => {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new ApiError('Not signed in', 401);

    const response = await send('/auth/refresh', { method: 'POST', body: { refreshToken } });
    return storeSession(await parse<Session>(response));
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

export const startAuth = async (phone: string) =>
  parse<AuthStart>(await send('/auth/user/start', { method: 'POST', body: { phone } }));

export const requestRegistrationOtp = async (input: {
  phone: string;
  name: string;
  email: string;
}) => parse(await send('/auth/user/register/request-otp', { method: 'POST', body: input }));

export const verifyOtp = async (flow: 'login' | 'register', phone: string, code: string) => {
  const response = await send(`/auth/user/${flow}/verify-otp`, {
    method: 'POST',
    body: { phone, code },
  });
  return storeSession(await parse<Session>(response));
};

export const signOut = async () => {
  // A refresh still running would otherwise store a new token after this clears it
  await refreshInFlight?.catch(() => undefined);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  await clearSession();
  if (refreshToken) {
    // Leaving is local either way; an offline API just lets the token expire
    await send('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  }
};

// For browsing, which works signed out and so must never trigger a refresh
export const publicApi = async <T>(path: string, options?: RequestOptions): Promise<T> =>
  parse<T>(await send(path, options));

export const api = async <T>(path: string, options?: RequestOptions): Promise<T> => {
  let response = accessToken ? await send(path, options) : null;

  if (!response || response.status === 401) {
    try {
      await refreshSession();
    } catch (error) {
      // A network failure isn't a lost session; only the API saying no is
      if (error instanceof ApiError && error.status === 401) {
        await clearSession();
        onSessionLost();
      }
      throw error;
    }
    response = await send(path, options);
  }

  return parse<T>(response);
};
