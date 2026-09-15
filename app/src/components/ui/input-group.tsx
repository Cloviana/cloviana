'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/utils/cn';

const inputGroupVariants = cva(
  'group/input-group file:text-foreground border-input relative flex w-full min-w-0 rounded-lg border text-[13px] transition-[color,box-shadow] outline-none has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 focus-within:border-ring focus-within:ring-ring/30 focus-within:ring-[3px] aria-invalid:bg-destructive/5 aria-invalid:ring-destructive/20 aria-invalid:border-destructive has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>textarea]:h-auto',
  {
    variants: {
      variant: {
        default:
          'bg-control text-foreground border-input placeholder:text-foreground-lighter/70',
      },
      size: {
        default: 'h-8 focus-within:ring-[3px]',
        sm: 'h-[30px] text-xs focus-within:ring-[3px]',
        xs: 'h-6 text-xs focus-within:ring-[3px]',
        lg: 'h-9 focus-within:ring-[3.5px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function InputGroup({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupVariants>) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(inputGroupVariants({ variant, size }), className)}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  'flex h-auto items-center justify-center gap-2 text-muted-foreground select-none [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*="size-"])]:size-4',
  {
    variants: {
      align: {
        'inline-start':
          'order-first pl-3 has-[>button]:ml-[-0.25rem] has-[>kbd]:ml-[-0.15rem]',
        'inline-end':
          'order-last pr-3 has-[>button]:mr-[-0.25rem] has-[>kbd]:mr-[-0.15rem]',
        'block-start': 'order-first w-full justify-start px-3 pt-2',
        'block-end': 'order-last w-full justify-start px-3 pb-2',
      },
      size: {
        default: 'text-[13px]',
        sm: 'text-xs',
        xs: 'text-xs',
        lg: 'text-[13px]',
      },
    },
    defaultVariants: {
      align: 'inline-start',
      size: 'default',
    },
  },
);

function InputGroupAddon({
  className,
  align = 'inline-start',
  size,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="presentation"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align, size }), className)}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest('button')) return;
        event.currentTarget.parentElement
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
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-[30px] px-2 text-xs',
        sm: 'h-6 px-2 text-xs',
        xs: 'h-5 px-1.5 text-xs',
        lg: 'h-8 px-3 text-[13px]',
        'icon-xs': 'size-5 p-0',
        'icon-sm': 'size-6 p-0',
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
  size = 'xs',
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof inputGroupButtonVariants>) {
  return (
    <button
      type={type}
      data-slot="input-group-button"
      className={cn(
        inputGroupButtonVariants({ size }),
        'text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupText({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="input-group-text"
      className={cn(
        'flex items-center gap-2 text-inherit [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-4',
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input-group-control"
      className={cn(
        'placeholder:text-foreground-lighter/70 min-w-0 flex-1 border-0 bg-transparent px-3 py-1 text-inherit ring-0 outline-none file:inline-flex file:h-[30px] file:border-0 file:bg-transparent file:text-[13px] file:font-medium focus-visible:ring-0 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-0',
        'group-has-[>[data-align=inline-start]]/input-group:pl-1',
        'group-has-[>[data-align=inline-end]]/input-group:pr-1',
        'group-has-[>[data-align=block-start]]/input-group:pb-3',
        'group-has-[>[data-align=block-end]]/input-group:pt-3',
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
    <textarea
      data-slot="input-group-control"
      className={cn(
        'placeholder:text-foreground-lighter/70 min-h-[80px] w-full flex-1 resize-none border-0 bg-transparent px-3 py-2 text-inherit ring-0 outline-none focus-visible:ring-0 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-0',
        'group-has-[>[data-align=inline-start]]/input-group:pl-1',
        'group-has-[>[data-align=inline-end]]/input-group:pr-1',
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
