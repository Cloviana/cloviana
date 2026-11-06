'use client';

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { XIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        'bg-blanket ease-inout-bold data-ending-style:ease-in-practical fixed inset-0 isolate z-50 transition-opacity duration-(--ds-duration-long) data-ending-style:opacity-0 data-ending-style:duration-(--ds-duration-medium) data-starting-style:opacity-0 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          'bg-surface-overlay text-body text-text-default shadow-overlay ease-inout-bold data-ending-style:ease-in-practical fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-(--spacing(8)))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl p-6 transition-[scale,opacity] duration-(--ds-duration-long) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-(--ds-duration-medium) data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none sm:max-w-sm',
          showCloseButton && '[&>[data-slot=dialog-header]]:pr-8',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="text-icon-subtle absolute top-4 right-4"
                size="icon-sm"
              >
                <XIcon aria-hidden="true" />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'border-border-default -mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close
          render={<Button variant="outline">Close</Button>}
        />
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      render={<Heading variant="dialog" />}
      className={className}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      render={<Text variant="description" />}
      className={cn(
        '[&_a]:text-link-default [&_a]:active:text-link-pressed [&_a]:underline [&_a]:underline-offset-3',
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
