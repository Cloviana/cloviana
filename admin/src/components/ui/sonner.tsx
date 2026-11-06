'use client';

import {
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  Check,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <div className="bg-icon-success flex size-4 items-center justify-center rounded-full">
            <Check className="text-icon-inverse size-2" strokeWidth={4} />
          </div>
        ),
        info: <InfoIcon className="text-icon-information size-4" />,
        warning: <TriangleAlertIcon className="text-icon-warning size-4" />,
        error: <OctagonXIcon className="text-icon-danger size-4" />,
        loading: (
          <Loader2Icon className="text-icon-default size-4 animate-spin" />
        ),
      }}
      style={
        {
          '--normal-bg': 'var(--ds-surface-overlay)',
          '--normal-text': 'var(--ds-text)',
          '--normal-border': 'var(--ds-border)',
          '--border-radius': 'var(--ds-radius-large)',
          fontFamily: 'var(--ds-font-family-body)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: `
      cn-toast
      group/toast
      text-body!
      p-4!
      gap-3!
      rounded-lg!
      border-line!
      shadow-overlay!
      data-[type=success]:border-border-success!
      data-[type=success]:bg-background-success!
      data-[type=warning]:border-border-warning!
      data-[type=warning]:bg-background-warning!
      data-[type=error]:border-border-danger!
      data-[type=error]:bg-background-danger!
      data-[type=info]:border-border-information!
      data-[type=info]:bg-background-information!
    `,
          title: `
      text-body!
      font-medium!
      group-data-[type=success]/toast:text-text-success!
      group-data-[type=warning]/toast:text-text-warning!
      group-data-[type=error]/toast:text-text-danger!
      group-data-[type=info]/toast:text-text-information!
    `,
          description: `
      text-body-small!
      group-data-[type=success]/toast:text-text-success!
      group-data-[type=warning]/toast:text-text-warning!
      group-data-[type=error]/toast:text-text-danger!
      group-data-[type=info]/toast:text-text-information!
    `,
          actionButton:
            'outline-none! disabled:bg-background-disabled! disabled:text-text-disabled! text-body! font-medium! rounded-md! bg-background-brand-bold! text-text-inverse! hover:bg-background-brand-bold-hovered! active:bg-background-brand-bold-pressed! focus-visible:ring-(length:--ds-border-width-focused)! focus-visible:ring-border-focused!',
          cancelButton:
            'outline-none! disabled:bg-background-disabled! disabled:text-text-disabled! text-body! font-medium! rounded-md! bg-background-neutral! text-text-default! hover:bg-background-neutral-hovered! active:bg-background-neutral-pressed! focus-visible:ring-(length:--ds-border-width-focused)! focus-visible:ring-border-focused!',
          closeButton:
            'outline-none! rounded-full! border-line! border-border-default! bg-surface-overlay! text-icon-default! hover:bg-surface-overlay-hovered! focus-visible:ring-(length:--ds-border-width-focused)! focus-visible:ring-border-focused!',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
