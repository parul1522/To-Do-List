import { ApiError, NetworkError } from '@/services/api/errors';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof NetworkError) return error.message;
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (error.status >= 500) return 'The server had a problem. Please try again shortly.';
    if (error.code === 'validation_error') {
      return error.validationIssues[0]?.message.replace(/^Value error, /, '') ?? error.message;
    }
    return error.message;
  }
  return fallback;
}

/** Map server-side validation issues onto form field names. */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const fields: Record<string, string> = {};
  for (const issue of error.validationIssues) {
    const name = issue.field.split('.').pop() ?? issue.field;
    fields[name] ??= issue.message.replace(/^Value error, /, '');
  }
  return fields;
}
