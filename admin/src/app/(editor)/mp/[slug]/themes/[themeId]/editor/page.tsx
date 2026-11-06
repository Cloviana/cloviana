import { notFound } from 'next/navigation';

import { getTheme } from '@/features/themes/api/get-theme';
import { ThemeEditor } from '@/features/themes/editor';

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ slug: string; themeId: string }>;
}) {
  const { slug, themeId } = await params;
  const theme = await getTheme(slug, themeId).catch(() => null);
  if (!theme) notFound();

  return <ThemeEditor slug={slug} themeId={themeId} themeName={theme.name} />;
}
