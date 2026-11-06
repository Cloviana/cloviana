'use client';

import { Combobox as ComboboxPrimitive } from '@base-ui/react';
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
  className,
  children,
  render = (
    <Button
      variant="outline"
      className="focus-visible:ring-border-focused/20 border-border-input bg-background-input enabled:hover:bg-background-input-hovered enabled:active:bg-background-input-pressed enabled:hover:not-focus-visible:not-aria-invalid:border-border-input-hovered enabled:aria-expanded:bg-background-input-pressed aria-invalid:border-border-danger aria-invalid:bg-background-danger aria-invalid:enabled:hover:bg-background-danger-hovered aria-invalid:enabled:active:bg-background-danger-pressed disabled:border-border-disabled disabled:bg-background-disabled data-placeholder:text-text-subtlest data-placeholder:hover:text-text-subtlest w-full justify-between font-normal focus-visible:ring-[3px]"
    />
  ),
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      render={render}
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="text-icon-subtle in-disabled:text-icon-disabled pointer-events-none size-4" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      className={cn(className)}
      {...props}
      render={
        <InputGroupButton variant="ghost" size="icon-xs">
          <XIcon className="pointer-events-none" />
        </InputGroupButton>
      }
    />
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  return (
    <InputGroup className={cn('w-auto', className)}>
      <InputGroupAddon align="inline-start" className="pr-1 pl-3">
        <SearchIcon aria-hidden="true" />
      </InputGroupAddon>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger render={<button type="button" />} />}
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = 'bottom',
  sideOffset = 6,
  align = 'start',
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    'side' | 'align' | 'sideOffset' | 'alignOffset' | 'anchor'
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            'group/combobox-content bg-surface-overlay text-text-default shadow-overlay ring-border-default *:data-[slot=input-group]:border-b-line *:data-[slot=input-group]:border-border-default *:data-[slot=input-group]:bg-background-input *:data-[slot=input-group]:has-[[data-slot=input-group-control]:focus-visible]:border-border-default data-open:animate-popup-enter data-closed:animate-popup-exit relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(8))] origin-(--transform-origin) overflow-hidden rounded-lg ring-(length:--ds-border-width) data-[chips=true]:min-w-(--anchor-width) *:data-[slot=input-group]:m-0 *:data-[slot=input-group]:min-h-10 *:data-[slot=input-group]:rounded-none *:data-[slot=input-group]:border-x-0 *:data-[slot=input-group]:border-t-0 *:data-[slot=input-group]:shadow-none *:data-[slot=input-group]:has-[[data-slot=input-group-control]:focus-visible]:ring-0',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxBack({
  className,
  children,
  ...props
}: React.ComponentProps<'button'>) {
  return (
    <div
      data-slot="combobox-back"
      className="border-border-default border-b-line p-1.5"
    >
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'text-text-subtlest! w-full justify-start border-0 px-2 font-normal',
          className,
        )}
        {...props}
      >
        <ArrowLeftIcon aria-hidden="true" />
        {children}
      </Button>
    </div>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'no-scrollbar max-h-[min(calc(18rem-(--spacing(10))),calc(var(--available-height)-(--spacing(10))))] scroll-py-1 space-y-(--ds-border-width) overflow-y-auto overscroll-contain p-1.5 data-empty:p-0',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  showIndicator = true,
  ...props
}: ComboboxPrimitive.Item.Props & {
  showIndicator?: boolean;
}) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "text-body data-highlighted:not-data-disabled:not-active:bg-background-neutral-subtle-hovered data-highlighted:not-data-disabled:text-text-default data-selected:bg-background-selected data-selected:text-text-selected data-selected:data-highlighted:not-data-disabled:text-text-selected data-selected:data-highlighted:not-data-disabled:not-active:bg-background-selected-hovered not-data-disabled:active:bg-background-neutral-subtle-pressed data-selected:not-data-disabled:active:bg-background-selected-pressed data-disabled:text-text-disabled data-disabled:data-selected:text-text-disabled relative flex w-full cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-hidden select-none data-disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      {showIndicator && (
        <ComboboxPrimitive.ItemIndicator
          render={
            <span className="pointer-events-none ml-auto flex size-4 shrink-0 items-center justify-center">
              <CheckIcon className="text-icon-selected in-data-disabled:text-icon-disabled pointer-events-none" />
            </span>
          }
        />
      )}
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        'text-body-small text-text-subtlest px-2 py-1.5',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        'text-body text-text-subtlest hidden w-full justify-center px-3 py-4 text-center group-data-empty/combobox-content:flex',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxStatus({
  message,
  loading,
  retry,
}: {
  message: string;
  loading?: boolean;
  retry?: () => Promise<unknown>;
}) {
  return (
    <div
      data-slot="combobox-status"
      role="status"
      className="text-text-subtlest text-body flex items-center justify-center gap-2 p-2"
    >
      {loading && <Spinner aria-hidden="true" />}
      <span className={loading ? 'sr-only' : undefined}>{message}</span>
      {retry && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={() => void retry()}
        >
          Retry
        </Button>
      )}
    </div>
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn(
        'bg-border-default -mx-1 my-1 h-(--ds-border-width)',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        'border-line border-border-input bg-background-input text-body hover:not-has-[[data-slot=combobox-chip-input]:disabled]:not-has-aria-invalid:bg-background-input-hovered hover:not-focus-within:not-has-[[data-slot=combobox-chip-input]:disabled]:not-has-aria-invalid:border-border-input-hovered has-[[data-slot=combobox-chip-input]:disabled]:border-border-disabled has-[[data-slot=combobox-chip-input]:disabled]:bg-background-disabled has-[[data-slot=combobox-chip-input]:disabled]:text-text-disabled focus-within:border-border-focused focus-within:ring-border-focused/20 has-aria-invalid:border-border-danger has-aria-invalid:bg-background-danger hover:has-aria-invalid:bg-background-danger-hovered flex min-h-8 flex-wrap items-center gap-1 rounded-lg bg-clip-padding px-3 py-1 transition-colors focus-within:ring-[3px] has-data-[slot=combobox-chip]:px-1',
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        'bg-background-accent-gray-subtler text-body-small text-text-default has-disabled:bg-background-disabled has-disabled:text-text-disabled flex min-h-6 w-fit items-center justify-center gap-1 rounded-sm px-1.5 font-medium whitespace-nowrap has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-data-[slot=combobox-chip-remove]:pr-0',
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          className="text-icon-subtle hover:text-icon-default disabled:text-icon-disabled -ml-1"
          data-slot="combobox-chip-remove"
          render={
            <Button variant="ghost" size="icon-xs">
              <XIcon className="pointer-events-none" />
            </Button>
          }
        />
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn(
        'text-body-large md:text-body placeholder:text-text-subtlest disabled:text-text-disabled disabled:placeholder:text-text-disabled min-w-16 flex-1 outline-none',
        className,
      )}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxBack,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxStatus,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
};
