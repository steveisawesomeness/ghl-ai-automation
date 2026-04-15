import { getHeaders, clearTokenCache } from './auth';

const BASE_URL = 'https://backend.leadconnectorhq.com';

export interface GHLResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

async function ghlFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<GHLResponse<T>> {
  const headers = getHeaders(options.method !== 'GET');

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (response.status === 401 && retry) {
    clearTokenCache();
    return ghlFetch<T>(path, options, false);
  }

  if (!response.ok && response.status !== 304) {
    const body = await response.text();
    throw new Error(`GHL API error ${response.status}: ${body}`);
  }

  const data = response.status === 204 ? null : await response.json() as T;

  return {
    data: data as T,
    status: response.status,
    ok: response.ok,
  };
}

export async function ghlGet<T>(path: string): Promise<T> {
  const result = await ghlFetch<T>(path, { method: 'GET' });
  return result.data;
}

export async function ghlPut<T>(path: string, body: unknown): Promise<T> {
  const result = await ghlFetch<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return result.data;
}

export async function ghlPost<T>(path: string, body: unknown): Promise<T> {
  const result = await ghlFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return result.data;
}

export async function ghlDelete<T>(path: string): Promise<T> {
  const result = await ghlFetch<T>(path, { method: 'DELETE' });
  return result.data;
}
