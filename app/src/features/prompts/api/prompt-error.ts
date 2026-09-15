import { isAxiosError } from 'axios';

export function getPromptError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;
    const message = data?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (message) return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
