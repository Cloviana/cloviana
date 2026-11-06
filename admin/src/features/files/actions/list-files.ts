'use server';
import { listFiles } from '../api/list-files';
import { fileListParamsSchema } from '../schemas/file.schema';
import type { FileListParams } from '../types/file';
export async function listFilesAction(
  slug: string,
  input: FileListParams = {},
) {
  return listFiles(slug, fileListParamsSchema.parse(input));
}
