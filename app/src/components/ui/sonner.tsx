'use client';

import {
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
  Check,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: (
          <div className="bg-success flex size-4 items-center justify-center rounded-full">
            <Check className="text-background size-2" strokeWidth={4} />
          </div>
        ),
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="text-warning size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: `
      cn-toast
      group/toast
      shadow-none!
      data-[type=success]:border-success-border!
      data-[type=success]:bg-success-surface!
      data-[type=warning]:border-warning-border!
      data-[type=warning]:bg-warning-surface!
      data-[type=error]:border-destructive!
      data-[type=error]:bg-destructive/10!
    `,
          title: `
      group-data-[type=success]/toast:text-success-foreground!
      group-data-[type=warning]/toast:text-warning-foreground!
      group-data-[type=error]/toast:text-destructive!
    `,
          description: `
      group-data-[type=success]/toast:text-success-foreground/90!
      group-data-[type=warning]/toast:text-warning-foreground/90!
      group-data-[type=error]/toast:text-destructive/90!
    `,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
