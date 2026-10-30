// Centralized HTTP client and API configuration for PotholeFix

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const isMockMode = (): boolean =>
  import.meta.env.VITE_USE_MOCK_DATA !== 'false';

const TOKEN_STORAGE_KEY = 'potholefix_auth_token';
const DEFAULT_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  isNetworkError: boolean;
  isTimeout: boolean;
  isUnauthorized: boolean;

  constructor(
    message: string,
    status?: number,
    data?: unknown,
    isNetworkError = false,
    isTimeout = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.isNetworkError = isNetworkError;
    this.isTimeout = isTimeout;
    this.isUnauthorized = status === 401;
  }
}

// Token management
export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to update auth token in storage', err);
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

// Global 401 Unauthorized Event Listener
type UnauthorizedHandler = () => void;
const unauthorizedHandlers: Set<UnauthorizedHandler> = new Set();

export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

function triggerUnauthorized(): void {
  clearAuthToken();
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler();
    } catch (e) {
      console.error('Error in onUnauthorized handler', e);
    }
  });
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions & { body?: unknown } = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipAuth = false, body, headers: customHeaders, ...fetchOptions } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(customHeaders || {});

  // Attach auth token if available and not skipped
  if (!skipAuth) {
    const token = getAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Auto-detect JSON vs FormData
  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    // When sending FormData, the browser MUST automatically set multipart/form-data with the boundary parameter
    requestBody = body;
    headers.delete('Content-Type');
  } else if (body !== undefined && body !== null) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    requestBody = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: requestBody,
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (response.status === 401) {
      triggerUnauthorized();
      throw new ApiError('Session expired or unauthorized. Please re-authenticate.', 401);
    }

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      const errorMessage =
        typeof errorData === 'object' && errorData !== null && 'detail' in errorData
          ? String((errorData as { detail: unknown }).detail)
          : `HTTP ${response.status}: Request to ${endpoint} failed`;

      throw new ApiError(errorMessage, response.status, errorData);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();
    return json as T;
  } catch (error) {
    clearTimeout(timer);

    if (error instanceof ApiError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        `Request timed out after ${timeoutMs}ms. The municipal server may be busy or unreachable.`,
        undefined,
        undefined,
        false,
        true
      );
    }

    const isNetwork = error instanceof TypeError || (error instanceof Error && error.message.includes('fetch'));
    throw new ApiError(
      isNetwork
        ? `Cannot connect to municipal backend at ${API_BASE_URL}. Ensure FastAPI is running.`
        : error instanceof Error
        ? error.message
        : 'Unknown network error',
      undefined,
      error,
      true
    );
  }
}

// Fluent REST Helpers
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),
};
