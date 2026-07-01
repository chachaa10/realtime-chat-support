import type { ErrorCode } from './errors/error-code';

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    errors?: Record<string, string[]>;
  };
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  meta: {
    cursor: number | null;
    hasMore: boolean;
  };
}

export function ApiSuccess<T>(data: T): ApiSuccessResponse<T> {
  return { data };
}

export function ApiError(
  code: ErrorCode,
  message: string,
  errors?: Record<string, string[]>,
): ApiErrorResponse {
  return { error: { code, message, ...(errors ? { errors } : {}) } };
}

export function ApiPaginated<T>(
  data: T[],
  cursor: number | null,
  hasMore: boolean,
): ApiPaginatedResponse<T> {
  return { data, meta: { cursor, hasMore } };
}
