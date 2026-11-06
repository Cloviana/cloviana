'use client';

import { useQuery } from '@tanstack/react-query';

import { themesQueryOptions } from '../queries';

/** The marketplace's themes, kept fresh after a rename invalidates the list. */
export function useThemes(slug: string) {
  return useQuery(themesQueryOptions(slug));
}
