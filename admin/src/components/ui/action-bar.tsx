'use client';

import { EllipsisIcon, type LucideIcon } from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Space the bar leaves free around itself; keep in sync with `max-w-[calc(100%-2rem)]` below.
const BAR_GUTTER = 32;

// Set by ActionBarPortal so the bar can play its exit animation while it is leaving.
const ActionBarContext = React.createContext({ open: true });

function ActionBar({ className, ...props }: React.ComponentProps<'div'>) {
  const { open } = React.useContext(ActionBarContext);
  return (
    <div
      data-slot="action-bar"
      data-state={open ? 'open' : 'closed'}
      role="region"
      inert={!open}
      className={cn(
        'data-[state=open]:animate-popup-enter data-[state=closed]:animate-popup-exit text-text-inverse shadow-overlay absolute bottom-4 left-1/2 z-40 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-1 rounded-lg bg-[#3B3D42] p-2 [--popup-enter:var(--ds-popup-enter-top)] [--popup-exit:var(--ds-popup-exit-top)]',
        className,
      )}
      {...props}
    />
  );
}

function ActionBarTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="action-bar-title"
      className={cn('text-body px-3 font-medium whitespace-nowrap', className)}
      {...props}
    />
  );
}

function ActionBarSeparator({
  className,
  ...props
}: React.ComponentProps<'span'>) {
  return (
    <span
      data-slot="action-bar-separator"
      aria-hidden="true"
      className={cn(
        'border-border-inverse mx-1 h-6 border-l opacity-30',
        className,
      )}
      {...props}
    />
  );
}

function ActionBarButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="action-bar-button"
      variant="ghost"
      size="sm"
      className={cn(
        'text-text-inverse enabled:hover:bg-background-inverse-subtle-hovered enabled:active:bg-background-inverse-subtle-pressed disabled:text-text-inverse bg-transparent disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}

function ActionBarMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="action-bar-menu-content"
      side="top"
      align="start"
      sideOffset={12}
      className={cn(
        'text-text-inverse w-auto min-w-44 bg-[#3B3D42] ring-0',
        className,
      )}
      {...props}
    />
  );
}

function ActionBarMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      data-slot="action-bar-menu-item"
      className={cn(
        'text-text-inverse focus:not-data-disabled:not-active:bg-background-inverse-subtle-hovered focus:not-data-disabled:text-text-inverse data-highlighted:not-data-disabled:not-active:bg-background-inverse-subtle-hovered data-highlighted:not-data-disabled:text-text-inverse not-data-disabled:active:bg-background-inverse-subtle-pressed',
        className,
      )}
      {...props}
    />
  );
}

type ActionBarAction = {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
};

// How many leading buttons fit in `available`, keeping room for the "more" button when some overflow.
// Always at least one, so the bar never shows only the menu.
function fitCount(
  widths: number[],
  more: number,
  gap: number,
  available: number,
) {
  const total = (count: number) =>
    widths.slice(0, count).reduce((sum, width) => sum + width, 0) +
    gap * Math.max(0, count - 1);
  if (total(widths.length) <= available) return widths.length;
  let count = widths.length - 1;
  while (count > 1 && total(count) + gap + more > available) count--;
  return Math.max(1, count);
}

/**
 * Actions in priority order: as many as fit render as buttons, the rest move into a "more" menu.
 * A hidden copy of the buttons gives their natural widths, so it adapts to label length and available space.
 */
function ActionBarActions({ actions }: { actions: ActionBarAction[] }) {
  const regionRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [fit, setFit] = React.useState(actions.length);
  const signature = actions.map(({ id, label }) => `${id}:${label}`).join('|');
  const visible = Math.min(fit, actions.length);

  React.useLayoutEffect(() => {
    const region = regionRef.current;
    const measure = measureRef.current;
    const bar = region?.closest<HTMLElement>('[data-slot="action-bar"]');
    const container = bar?.parentElement;
    if (!region || !measure || !bar || !container) return;

    const update = () => {
      const widths = Array.from(
        measure.children,
        (child) => (child as HTMLElement).offsetWidth,
      );
      const more = widths.pop() ?? 0;
      const gap = parseFloat(getComputedStyle(measure).columnGap) || 0;
      // Everything in the bar except this region: padding, gaps and the other children.
      const style = getComputedStyle(bar);
      const others = Array.from(bar.children).filter(
        (child) => child !== region,
      );
      const chrome =
        parseFloat(style.paddingLeft) +
        parseFloat(style.paddingRight) +
        (parseFloat(style.columnGap) || 0) * others.length +
        others.reduce(
          (sum, child) => sum + (child as HTMLElement).offsetWidth,
          0,
        );
      setFit(
        fitCount(
          widths,
          more,
          gap,
          container.clientWidth - BAR_GUTTER - chrome,
        ),
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [signature]);

  const button = ({
    id,
    label,
    icon: Icon,
    onSelect,
    disabled,
  }: ActionBarAction) => (
    <ActionBarButton
      key={id}
      type="button"
      disabled={disabled}
      onClick={onSelect}
    >
      {Icon && <Icon data-icon="inline-start" aria-hidden="true" />}
      {label}
    </ActionBarButton>
  );
  const overflow = actions.slice(visible);

  return (
    <div
      ref={regionRef}
      data-slot="action-bar-actions"
      className="relative flex items-center gap-1"
    >
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 flex gap-1"
      >
        {actions.map(button)}
        <ActionBarButton size="icon" tabIndex={-1}>
          <EllipsisIcon />
        </ActionBarButton>
      </div>
      {actions.slice(0, visible).map(button)}
      {overflow.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ActionBarButton
              size="icon"
              type="button"
              aria-label="More actions"
            >
              <EllipsisIcon aria-hidden="true" />
            </ActionBarButton>
          </DropdownMenuTrigger>
          <ActionBarMenuContent>
            {overflow.map(({ id, label, icon: Icon, onSelect, disabled }) => (
              <ActionBarMenuItem
                key={id}
                disabled={disabled}
                onSelect={onSelect}
              >
                {Icon && <Icon aria-hidden="true" />}
                {label}
              </ActionBarMenuItem>
            ))}
          </ActionBarMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

// Matches the duration of --ds-popup-exit-*.
const EXIT_MS = 100;

/**
 * Renders the bar inside `container`, which must be positioned. Without one,
 * it uses the closest sidebar inset so the bar floats over the page content.
 *
 * Keep it mounted and toggle `open`: when closed, the bar keeps showing what it
 * last rendered while it fades out, then unmounts.
 */
function ActionBarPortal({
  container,
  open = true,
  children,
}: {
  container?: HTMLElement | null;
  open?: boolean;
  children: React.ReactNode;
}) {
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const [target, setTarget] = React.useState<HTMLElement | null>(
    container ?? null,
  );
  const [present, setPresent] = React.useState(open);
  const lastChildren = React.useRef(children);

  React.useEffect(() => {
    setTarget(
      container ??
        anchorRef.current?.closest<HTMLElement>(
          '[data-slot="sidebar-inset"]',
        ) ??
        null,
    );
  }, [container]);

  React.useLayoutEffect(() => {
    if (open) lastChildren.current = children;
  });

  React.useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }
    const timer = setTimeout(() => setPresent(false), EXIT_MS);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <>
      <span ref={anchorRef} hidden />
      {target &&
        (open || present) &&
        createPortal(
          <ActionBarContext.Provider value={{ open }}>
            {open ? children : lastChildren.current}
          </ActionBarContext.Provider>,
          target,
        )}
    </>
  );
}

export type { ActionBarAction };
export {
  ActionBar,
  ActionBarActions,
  ActionBarButton,
  ActionBarMenuContent,
  ActionBarMenuItem,
  ActionBarPortal,
  ActionBarSeparator,
  ActionBarTitle,
};
