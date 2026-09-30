import type { ApiErrorBody, ValidationIssue } from '@shared/types/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let body: Partial<ApiErrorBody> | null = null;
    try {
      body = (await response.json()) as Partial<ApiErrorBody>;
    } catch {
      // Non-JSON error (proxy, gateway). Fall through to a generic message.
    }
    const error = body?.error;
    return new ApiError(
      response.status,
      error?.code ?? 'http_error',
      error?.message ?? `Request failed (${response.status})`,
      error?.details ?? null,
    );
  }

  get validationIssues(): ValidationIssue[] {
    return Array.isArray(this.details) ? (this.details as ValidationIssue[]) : [];
  }
}

/** The request never reached the server (offline, DNS, timeout). */
export class NetworkError extends Error {
  constructor(message = "Can't reach the server. Check your connection and try again.") {
    super(message);
    this.name = 'NetworkError';
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
