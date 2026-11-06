'use client';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Heading } from '@/components/ui/typography';
import { paths } from '@/config/paths';

import { useThemes } from '../hooks/use-themes';
import {
  mockPublishedThemeDomain,
  mockPublishedThemePreviewUrl,
} from '../mocks/published-theme';

import { CreateThemeButton } from './create-theme-button';
import { PublishedTheme } from './published-theme/published-theme';
import { ThemeRow } from './theme-row';

export function ThemesList({ slug }: { slug: string }) {
  const { data: themes = [] } = useThemes(slug);
  const publishedTheme = themes.find((theme) => theme.isLive);
  const otherThemes = themes.filter((theme) => !theme.isLive);

  return (
    <div className="flex flex-col gap-8">
      {publishedTheme ? (
        <PublishedTheme
          slug={slug}
          theme={publishedTheme}
          domain={mockPublishedThemeDomain}
          previewUrl={mockPublishedThemePreviewUrl}
          editHref={paths.mp.themes.editor.getHref(slug, publishedTheme.id)}
        />
      ) : themes.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No theme yet</EmptyTitle>
            <EmptyDescription>
              Create your storefront to start building it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateThemeButton slug={slug} />
          </EmptyContent>
        </Empty>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No published theme</EmptyTitle>
            <EmptyDescription>
              Your storefront is not published yet.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {otherThemes.length > 0 && (
        <section aria-labelledby="all-themes" className="flex flex-col gap-3">
          <Heading as="h2" variant="section" id="all-themes">
            Themes
          </Heading>
          <ul className="border-line border-border-default bg-surface divide-border-default divide-y rounded-lg">
            {otherThemes.map((theme) => (
              <ThemeRow
                key={theme.id}
                slug={slug}
                theme={theme}
                editHref={paths.mp.themes.editor.getHref(slug, theme.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
