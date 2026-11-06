'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { createThemeAction } from '../actions/create-theme';
import { themeKeys } from '../queries';

/** Fallback for a marketplace whose default theme was not created during setup. */
export function CreateThemeButton({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () => createThemeAction(slug, {}),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      void queryClient.invalidateQueries({ queryKey: themeKeys.list(slug) });
    },
    onError: () =>
      toast.error('Could not create the storefront. Please try again.'),
  });

  return (
    <Button loading={create.isPending} onClick={() => create.mutate()}>
      Create storefront
    </Button>
  );
}
