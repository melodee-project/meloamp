/**
 * Helpers for turning unknown thrown values into user-presentable strings.
 *
 * API errors arrive as `AxiosError` (or anything a mock throws); call sites
 * should not need `any` to read `response.data.message`.
 */

interface ApiErrorBody {
  message?: unknown;
  detail?: unknown;
  title?: unknown;
  errors?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return undefined;
}

/** Extract an API error message, falling back to `Error.message`, then to a default. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  const record = asRecord(error);
  if (!record) return fallback;

  const response = asRecord(record.response);
  const body = asRecord(response?.data) as ApiErrorBody | null;

  return firstString(
    body?.message,
    body?.detail,
    body?.title,
    record.message,
  ) ?? fallback;
}

/** Extract the HTTP status from an unknown error, if present. */
export function getErrorStatus(error: unknown): number | undefined {
  const response = asRecord(asRecord(error)?.response);
  const status = response?.status;
  return typeof status === 'number' ? status : undefined;
}

/** True when the error is an axios cancellation (used by abort-on-unmount). */
export function isCanceledError(error: unknown): boolean {
  const record = asRecord(error);
  return record?.code === 'ERR_CANCELED' || record?.name === 'CanceledError';
}
