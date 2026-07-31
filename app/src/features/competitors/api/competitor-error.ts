import { isAxiosError } from 'axios';

export function getCompetitorError(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)
      ?.message;
    if (message) return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
