import { queryOptions } from '@tanstack/react-query';

import { getThemeAction } from './actions/get-theme';
import { listThemeVersionsAction } from './actions/list-theme-versions';
import { listThemesAction } from './actions/list-themes';

export const themeKeys = {
  all: (slug: string) => ['themes', slug] as const,
  list: (slug: string) => [...themeKeys.all(slug), 'list'] as const,
  detail: (slug: string, themeId: string) =>
    [...themeKeys.all(slug), 'detail', themeId] as const,
  versions: (slug: string, themeId: string) =>
    [...themeKeys.detail(slug, themeId), 'versions'] as const,
};

export const themesQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: themeKeys.list(slug),
    queryFn: () => listThemesAction(slug),
  });

export const themeQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: themeKeys.detail(slug, themeId),
    queryFn: () => getThemeAction(slug, themeId),
  });

export const themeVersionsQueryOptions = (slug: string, themeId: string) =>
  queryOptions({
    queryKey: themeKeys.versions(slug, themeId),
    queryFn: () => listThemeVersionsAction(slug, themeId),
  });
