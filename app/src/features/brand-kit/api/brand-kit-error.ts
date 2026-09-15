import { isAxiosError } from 'axios';

export function getBrandKitError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string | string[] } | undefined
    )?.message;
    if (Array.isArray(message)) return message[0] ?? fallback;
    if (typeof message === 'string') return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
