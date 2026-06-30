const API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(message = 'Validation failed', errors?: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR', 400, errors);
    this.name = 'ValidationError';
  }
}

const errorMap: Record<
  string,
  new (message: string, errors?: Record<string, string[]>) => ApiError
> = {
  NOT_FOUND: NotFoundError,
  FORBIDDEN: ForbiddenError,
  CONFLICT: ConflictError,
  VALIDATION_ERROR: ValidationError,
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errBody = body.error ?? body;
    const ErrorClass = errorMap[errBody.code] ?? ApiError;
    throw new ErrorClass(errBody.message ?? 'Request failed', errBody.errors);
  }

  const body = await res.json();
  return body.data as T;
}

export function get<T>(path: string, options?: RequestInit) {
  return request<T>(path, { method: 'GET', ...options });
}

export function post<T>(path: string, body?: unknown, options?: RequestInit) {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export function patch<T>(path: string, body?: unknown, options?: RequestInit) {
  return request<T>(path, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
  });
}

export function del<T>(path: string, options?: RequestInit) {
  return request<T>(path, { method: 'DELETE', ...options });
}
