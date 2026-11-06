'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { updateThemeAction } from '../../actions/update-theme';
import { themeKeys } from '../../queries';
import { themeNameSchema } from '../../schemas/theme.schema';

const renameThemeFormSchema = z.object({ name: themeNameSchema });

type RenameThemeValues = z.infer<typeof renameThemeFormSchema>;

interface RenameThemeDialogProps {
  slug: string;
  themeId: string;
  themeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameThemeDialog({
  open,
  onOpenChange,
  ...formProps
}: RenameThemeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename theme</DialogTitle>
        </DialogHeader>
        <RenameThemeForm {...formProps} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** Lives inside the dialog's content, so it starts from the current name each time the dialog opens. */
function RenameThemeForm({
  slug,
  themeId,
  themeName,
  onClose,
}: Omit<RenameThemeDialogProps, 'open' | 'onOpenChange'> & {
  onClose: () => void;
}) {
  const id = useId();
  const queryClient = useQueryClient();
  const form = useForm<RenameThemeValues>({
    resolver: zodResolver(renameThemeFormSchema),
    defaultValues: { name: themeName },
  });

  const rename = useMutation({
    mutationFn: (values: RenameThemeValues) =>
      updateThemeAction(slug, themeId, values),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success('Theme renamed.');
      void queryClient.invalidateQueries({ queryKey: themeKeys.list(slug) });
      onClose();
    },
    onError: () => toast.error('Could not rename the theme. Please try again.'),
  });

  const error = form.formState.errors.name;

  return (
    <form
      className="flex flex-col gap-4"
      noValidate
      onSubmit={form.handleSubmit((values) =>
        values.name === themeName ? onClose() : rename.mutate(values),
      )}
    >
      <FieldGroup>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor={`${id}-name`} className="sr-only">
            Theme name
          </FieldLabel>
          <Input
            id={`${id}-name`}
            maxLength={100}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-name-error` : undefined}
            {...form.register('name')}
          />
          <FieldError id={`${id}-name-error`} errors={[error]} />
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" loading={rename.isPending}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}
