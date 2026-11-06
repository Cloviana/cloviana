import { ApiError } from '@/lib/api/api-client';

export function themeActionError(error: unknown, fallback: string) {
  return {
    success: false as const,
    message:
      error instanceof ApiError && error.details ? error.details : fallback,
  };
}
