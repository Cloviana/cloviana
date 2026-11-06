import { notFound } from 'next/navigation';

import { getTheme } from '@/features/themes/api/get-theme';
import { ThemeEditor } from '@/features/themes/editor';
import { getEditorState } from '@/features/themes/editor/server';

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ slug: string; themeId: string }>;
}) {
  const { slug, themeId } = await params;
  const theme = await getTheme(slug, themeId).catch(() => null);
  if (!theme) notFound();

  // Fetched here so the code view knows its revision without waiting for the browser.
  const initialState = await getEditorState(slug, themeId);

  return (
    <ThemeEditor
      slug={slug}
      themeId={themeId}
      themeName={theme.name}
      initialState={initialState}
    />
  );
}
