'use client';

import { RotateCcw, Save } from 'lucide-react';

import {
  ActionBar,
  ActionBarButton,
  ActionBarPortal,
  ActionBarSeparator,
  ActionBarTitle,
} from '@/components/ui/action-bar';

/** Always render it and toggle `open`, so the bar can fade out instead of vanishing. */
export function UnsavedChangesBar({
  open,
  onDiscard,
  isSaving = false,
  form,
}: {
  open: boolean;
  onDiscard: () => void;
  isSaving?: boolean;
  form: string;
}) {
  return (
    <ActionBarPortal open={open}>
      <ActionBar aria-label="Unsaved changes">
        <ActionBarTitle>Unsaved changes</ActionBarTitle>
        <ActionBarSeparator />
        <ActionBarButton type="button" disabled={isSaving} onClick={onDiscard}>
          <RotateCcw data-icon="inline-start" aria-hidden="true" />
          Discard
        </ActionBarButton>
        <ActionBarButton type="submit" form={form} loading={isSaving}>
          <Save data-icon="inline-start" aria-hidden="true" />
          Save
        </ActionBarButton>
      </ActionBar>
    </ActionBarPortal>
  );
}
