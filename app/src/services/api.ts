import { API_URL, REQUEST_TIMEOUT_MS } from '../config';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  skipUnauthorizedHandler?: boolean;
}

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function getDeviceTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function buildHeaders(hasBody: boolean) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  return headers;
}

async function parseError(response: Response) {
  try {
    const data = await response.json();
    return data.message ?? 'Erro inesperado.';
  } catch {
    return 'Erro inesperado.';
  }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique sua internet.', 0);
  } finally {
    clearTimeout(timer);
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipUnauthorizedHandler = false } = options;
  const response = await fetchWithTimeout(`${API_URL}${path}`, {
    method,
    headers: buildHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) unauthorizedHandler?.();
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
