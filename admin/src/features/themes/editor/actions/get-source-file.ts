'use server';

import { getSourceFile } from '../api/get-source-file';

export async function getSourceFileAction(
  slug: string,
  themeId: string,
  path: string,
) {
  return getSourceFile(slug, themeId, path);
}
