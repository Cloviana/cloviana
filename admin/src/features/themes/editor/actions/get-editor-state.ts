'use server';

import { getEditorState } from '../api/get-editor-state';

export async function getEditorStateAction(slug: string, themeId: string) {
  return getEditorState(slug, themeId);
}
