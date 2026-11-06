import { z } from 'zod';

import { FILE_SORTS } from '../types/file';

export const fileListParamsSchema = z
  .object({
    query: z.string().trim().max(100).optional(),
    type: z.enum(['IMAGE', 'VIDEO']).optional(),
    minSize: z.number().int().min(0).max(2147483647).optional(),
    maxSize: z.number().int().min(0).max(2147483647).optional(),
    productId: z.string().uuid().optional(),
    sort: z.enum(FILE_SORTS).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    cursor: z.string().max(2048).optional(),
  })
  .refine(
    (params) =>
      params.minSize === undefined ||
      params.maxSize === undefined ||
      params.minSize <= params.maxSize,
    { message: 'Minimum size must not exceed maximum size.' },
  );

export const prepareFileUploadSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  contentType: z.string().regex(/^(image\/[a-zA-Z0-9.+-]+|video\/(mp4|webm))$/),
  size: z
    .number()
    .int()
    .min(1)
    .max(50 * 1024 * 1024),
});
export const completeFileUploadSchema = z.object({
  uploadId: z.string().uuid(),
  filename: z.string().trim().min(1).max(255),
});
