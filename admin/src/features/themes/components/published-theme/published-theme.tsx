import { Text } from '@/components/ui/typography';

import { formatAdded } from '../../lib/format-added';
import type { Theme } from '../../types/theme';

import { PreviewOverlay } from './preview-overlay';
import { PublishedThemeDomain } from './published-theme-domain';
import { ThemeActions } from './theme-actions';
import { ThemePreview } from './theme-preview';

interface PublishedThemeProps {
  slug: string;
  theme: Theme;
  domain: string;
  previewUrl: string | null;
  editHref: string;
}

export function PublishedTheme({
  slug,
  theme,
  domain,
  previewUrl,
  editHref,
}: PublishedThemeProps) {
  const storeUrl = `https://${domain}`;

  return (
    <section
      aria-label="Published theme"
      className="border-line border-border-default bg-surface-sunken relative isolate overflow-hidden rounded-lg"
    >
      <ThemePreview name={theme.name} src={previewUrl} editHref={editHref} />
      <PreviewOverlay />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
        <div className="flex min-w-0 flex-col">
          <PublishedThemeDomain domain={domain} href={storeUrl} />
          <Text
            as="span"
            variant="caption"
            className="text-text-inverse truncate"
          >
            {theme.name} · Added: {formatAdded(theme.createdAt)}
          </Text>
        </div>
        <ThemeActions
          slug={slug}
          themeId={theme.id}
          themeName={theme.name}
          storeUrl={storeUrl}
          editHref={editHref}
        />
      </div>
    </section>
  );
}
