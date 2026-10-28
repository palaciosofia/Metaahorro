export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: FieldError[] = [],
  ) {
    super(message);
  }

  fieldError(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.message;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

let token: string | null = null;
let onUnauthorized: () => void = () => {};

export function setToken(value: string | null) {
  token = value;
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function request<T>(path: string, { method = 'GET', body, headers = {} }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BASE_URL + path, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'No hay conexión con el servidor. Revisa que la API esté encendida.');
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized();
    const error = data?.error;
    throw new ApiError(
      response.status,
      error?.code ?? 'UNKNOWN_ERROR',
      error?.message ?? 'No se pudo completar la solicitud',
      Array.isArray(error?.details) ? error.details : [],
    );
  }
  return data as T;
}
