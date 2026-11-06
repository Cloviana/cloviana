'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

function InputGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        'group/input-group border-line border-border-input bg-background-input hover:not-has-[[data-slot=input-group-control]:disabled]:not-has-[[data-slot][aria-invalid=true]]:bg-background-input-hovered hover:not-has-[[data-slot=input-group-control]:disabled]:not-has-[[data-slot=input-group-control]:focus-visible]:not-has-[[data-slot][aria-invalid=true]]:border-border-input-hovered has-[[data-slot=input-group-control]:disabled]:border-border-disabled has-[[data-slot=input-group-control]:disabled]:bg-background-disabled has-[[data-slot=input-group-control]:disabled]:text-text-disabled has-[[data-slot=input-group-control]:focus-visible]:border-border-focused has-[[data-slot=input-group-control]:focus-visible]:ring-border-focused/20 has-[[data-slot][aria-invalid=true]]:border-border-danger has-[[data-slot][aria-invalid=true]]:bg-background-danger hover:has-[[data-slot][aria-invalid=true]]:bg-background-danger-hovered relative flex h-8 w-full min-w-0 items-center rounded-md transition-colors outline-none has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5',
        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-body font-medium text-text-subtle [&>svg]:text-icon-default select-none group-has-[[data-slot=input-group-control]:disabled]/input-group:text-text-disabled group-has-[[data-slot=input-group-control]:disabled]/input-group:[&>svg]:text-icon-disabled [&>kbd]:rounded-xs [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        'inline-start':
          'order-first pl-2 has-[>button]:-ml-1 has-[>kbd]:-ml-0.5',
        'inline-end': 'order-last pr-2 has-[>button]:-mr-1 has-[>kbd]:-mr-0.5',
        'block-start':
          'order-first w-full justify-start px-3 pt-2 group-has-[>input]/input-group:pt-2 [.border-b-line]:pb-2',
        'block-end':
          'order-last w-full justify-start px-3 pb-2 group-has-[>input]/input-group:pb-2 [.border-t-line]:pt-2',
      },
    },
    defaultVariants: {
      align: 'inline-start',
    },
  },
);

function InputGroupAddon({
  className,
  align = 'inline-start',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) {
          return;
        }
        e.currentTarget.parentElement
          ?.querySelector<HTMLElement>(
            "input, textarea, select, [contenteditable='true']",
          )
          ?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva(
  'flex items-center gap-2 text-body shadow-none',
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-sm px-1.5 [&>svg:not([class*='size-'])]:size-4",
        sm: '',
        'icon-xs': 'size-6 rounded-sm p-0 has-[>svg]:p-0',
        'icon-sm': 'size-8 p-0 has-[>svg]:p-0',
      },
    },
    defaultVariants: {
      size: 'xs',
    },
  },
);

function InputGroupButton({
  className,
  type = 'button',
  variant = 'ghost',
  size = 'xs',
  ...props
}: Omit<React.ComponentProps<typeof Button>, 'size' | 'type'> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: 'button' | 'submit' | 'reset';
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      size={size}
      variant={variant}
      className={(state) =>
        cn(
          inputGroupButtonVariants({ size }),
          typeof className === 'function' ? className(state) : className,
        )
      }
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        "text-body text-text-subtlest group-has-[[data-slot=input-group-control]:disabled]/input-group:text-text-disabled [&_svg]:text-icon-subtle group-has-[[data-slot=input-group-control]:disabled]/input-group:[&_svg]:text-icon-disabled flex items-center gap-2 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        'flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 enabled:hover:border-transparent enabled:hover:bg-transparent enabled:active:bg-transparent disabled:bg-transparent aria-invalid:ring-0',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<'textarea'>) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        'flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 enabled:hover:bg-transparent enabled:active:bg-transparent disabled:bg-transparent aria-invalid:bg-transparent aria-invalid:ring-0',
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
