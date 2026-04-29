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
          <div className="flex size-4 items-center justify-center rounded-full bg-green-700">
            <Check className="size-2 text-white" strokeWidth={4} />
          </div>
        ),
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
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
      data-[type=success]:!border-green-600
      data-[type=success]:!bg-green-50
      data-[type=error]:!border-red-600
      data-[type=error]:!bg-red-50
    `,
          title: `
      group-data-[type=success]/toast:!text-green-800
      group-data-[type=error]/toast:!text-red-800
    `,
          description: `
      group-data-[type=success]/toast:!text-green-800/90
      group-data-[type=error]/toast:!text-red-800/90
    `,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
