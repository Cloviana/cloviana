'use client';

import { CheckIcon, ChevronRightIcon } from 'lucide-react';
import { DropdownMenu as DropdownMenuPrimitive, Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'group/dropdown-menu-content bg-surface-overlay text-text-default ring-border-default shadow-overlay data-[state=open]:animate-popup-enter data-[state=closed]:animate-popup-exit z-50 max-h-(--radix-dropdown-menu-content-available-height) w-(--radix-dropdown-menu-trigger-width) min-w-32 origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-lg p-1 ring-(length:--ds-border-width) data-[state=closed]:overflow-hidden',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = 'default',
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item focus:not-data-disabled:not-active:bg-background-neutral-subtle-hovered focus:not-data-disabled:text-text-default data-[variant=destructive]:text-text-danger data-[variant=destructive]:focus:not-data-disabled:text-text-danger data-[variant=destructive]:*:[svg]:text-icon-danger data-[variant=destructive]:data-disabled:text-text-disabled data-[variant=destructive]:data-disabled:*:[svg]:text-icon-disabled text-body data-disabled:text-text-disabled relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 font-normal outline-hidden select-none data-disabled:pointer-events-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'data-[active=true]:bg-background-selected data-[active=true]:text-text-selected data-[active=true]:focus:not-data-disabled:not-active:bg-background-selected-hovered data-[active=true]:data-highlighted:not-data-disabled:not-active:bg-background-selected-hovered data-[active=true]:not-data-disabled:active:bg-background-selected-pressed data-[active=true]:data-disabled:text-text-disabled',
        'not-data-disabled:active:bg-background-neutral-subtle-pressed',
        'data-highlighted:not-data-disabled:not-active:bg-background-neutral-subtle-hovered data-highlighted:not-data-disabled:text-text-default data-[variant=destructive]:data-highlighted:not-data-disabled:text-text-danger',
        className,
      )}
      {...props}
    >
      <Slot.Slottable>{children}</Slot.Slottable>
      <CheckIcon
        className="invisible ml-auto size-3 group-data-[active=true]/dropdown-menu-item:visible"
        strokeWidth={2.5}
      />
    </DropdownMenuPrimitive.Item>
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "focus:not-data-disabled:not-active:bg-background-neutral-subtle-hovered focus:not-data-disabled:text-text-default not-data-disabled:active:bg-background-neutral-subtle-pressed text-body data-disabled:text-text-disabled relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 outline-hidden select-none data-disabled:pointer-events-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "focus:not-data-disabled:not-active:bg-background-neutral-subtle-hovered focus:not-data-disabled:text-text-default not-data-disabled:active:bg-background-neutral-subtle-pressed text-body data-disabled:text-text-disabled relative flex cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 outline-hidden select-none data-disabled:pointer-events-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        'text-text-subtlest text-body-small px-1.5 py-1 font-medium data-inset:pl-8',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        'bg-border-default -mx-1 my-1 h-(--ds-border-width)',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        'text-text-subtlest group-focus/dropdown-menu-item:text-text-default text-body-small ml-auto',
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:not-data-disabled:not-active:bg-background-neutral-subtle-hovered focus:not-data-disabled:text-text-default data-[state=open]:not-data-disabled:bg-background-neutral-subtle-pressed data-[state=open]:not-data-disabled:text-text-default text-body flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 outline-hidden select-none data-inset:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="cn-rtl-flip ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        'group/dropdown-menu-content bg-surface-overlay text-text-default ring-border-default shadow-overlay data-[state=open]:animate-popup-enter data-[state=closed]:animate-popup-exit z-50 min-w-[96px] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-lg p-1 ring-(length:--ds-border-width) duration-(--ds-duration-xshort)',
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
