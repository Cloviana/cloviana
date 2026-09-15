'use client';

import { useEffect, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitLabel: string;
  /** Seeded into the field every time the dialog opens. */
  initialName?: string;
  placeholder?: string;
  maxLength: number;
  requiredMessage: string;
  isPending: boolean;
  /** Server-side failure from the caller's mutation, shown under the field. */
  error?: string;
  onSubmit: (name: string) => void;
};

/**
 * The single-text-field dialog shared by folder create/rename and document
 * rename. Owns the field and the "name is required" check; the caller owns the
 * mutation and any error it comes back with.
 */
export function NameDialog({
  open,
  onOpenChange,
  title,
  submitLabel,
  initialName,
  placeholder,
  maxLength,
  requiredMessage,
  isPending,
  error,
  onSubmit,
}: NameDialogProps) {
  const [name, setName] = useState(initialName ?? '');
  const [emptyError, setEmptyError] = useState<string>();

  useEffect(() => {
    if (open) {
      setName(initialName ?? '');
      setEmptyError(undefined);
    }
  }, [open, initialName]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setEmptyError(requiredMessage);
      return;
    }
    setEmptyError(undefined);
    onSubmit(trimmedName);
  };

  const shownError = emptyError ?? error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Field data-invalid={shownError ? true : undefined}>
              <FieldLabel htmlFor="name-dialog-input" className="sr-only">
                Name
              </FieldLabel>
              <Input
                id="name-dialog-input"
                value={name}
                autoFocus
                maxLength={maxLength}
                placeholder={placeholder}
                onChange={(event) => setName(event.target.value)}
              />
              {shownError && <FieldError>{shownError}</FieldError>}
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
