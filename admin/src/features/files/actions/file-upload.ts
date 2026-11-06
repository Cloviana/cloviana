'use server';
import { prepareFileUpload, completeFileUpload } from '../api/file-upload';
import {
  completeFileUploadSchema,
  prepareFileUploadSchema,
} from '../schemas/file.schema';
import type { CompleteFileUpload, PrepareFileUpload } from '../types/file';
export async function prepareFileUploadAction(
  slug: string,
  input: PrepareFileUpload,
) {
  return prepareFileUpload(slug, prepareFileUploadSchema.parse(input));
}
export async function completeFileUploadAction(
  slug: string,
  input: CompleteFileUpload,
) {
  return completeFileUpload(slug, completeFileUploadSchema.parse(input));
}
