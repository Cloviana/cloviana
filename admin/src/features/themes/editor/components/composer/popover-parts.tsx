import { ComposerPrimitive } from '@assistant-ui/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Positions a trigger popover above the message box. */
export const POPOVER_CLASS =
  'bg-surface-overlay shadow-overlay border-border-default absolute right-0 bottom-full left-0 z-20 mb-2 max-h-64 overflow-y-auto rounded-lg border p-1';

const ROW_CLASS =
  'text-body text-text-default data-[highlighted]:bg-surface-hovered flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left outline-none';

export function PopoverRow({
  title,
  description,
  className,
}: {
  title: ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <>
      <span className={cn('min-w-0 truncate', className)}>{title}</span>
      {description && (
        <span className="text-body-small text-text-subtlest min-w-0 truncate">
          {description}
        </span>
      )}
    </>
  );
}

/** The two-level list every trigger shows: its categories, then the items inside one. */
export function PopoverLists() {
  return (
    <>
      <ComposerPrimitive.TriggerPopoverCategories>
        {(categories) =>
          categories.map((category) => (
            <ComposerPrimitive.TriggerPopoverCategoryItem
              key={category.id}
              categoryId={category.id}
              className={ROW_CLASS}
            >
              <PopoverRow title={category.label} />
            </ComposerPrimitive.TriggerPopoverCategoryItem>
          ))
        }
      </ComposerPrimitive.TriggerPopoverCategories>
      <ComposerPrimitive.TriggerPopoverItems>
        {(items) =>
          items.length ? (
            items.map((item, index) => (
              <ComposerPrimitive.TriggerPopoverItem
                key={item.id}
                item={item}
                index={index}
                className={ROW_CLASS}
              >
                <PopoverRow
                  title={item.label}
                  description={item.description}
                  className={item.type === 'file' ? 'text-code' : undefined}
                />
              </ComposerPrimitive.TriggerPopoverItem>
            ))
          ) : (
            <p className="text-body-small text-text-subtlest px-2 py-1.5">
              Nothing matches.
            </p>
          )
        }
      </ComposerPrimitive.TriggerPopoverItems>
    </>
  );
}
