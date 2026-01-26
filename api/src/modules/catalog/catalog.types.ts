export interface PaginationParams {
  cursor?: string;
  limit?: number;
  q?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}
