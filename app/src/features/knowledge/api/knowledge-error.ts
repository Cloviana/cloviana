import { isAxiosError } from 'axios';

export function getKnowledgeError(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; detail?: string }
      | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
    if (typeof data?.detail === 'string') return data.detail;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}
