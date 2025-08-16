'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

import { useGenerateStoreDropdownItem } from '@/app/store/[storeId]/shared/usecases/use-generate-store-dropdown-item';

export const AccountDropdown = () => {
  const { menu } = useGenerateStoreDropdownItem();
  return (
    <DropdownMenu.Portal>
      <DropdownMenu.Content
        sideOffset={5}
        align="end"
        className="dropdown-content ml-3"
      >
        <div className="dropdown-content-section">
          {menu.map((entry, i) =>
            entry.type === 'separator' ? (
              <DropdownMenu.Separator
                key={`sep-${i}`}
                className="dropdown-separator"
              />
            ) : (
              <DropdownMenu.Item
                key={entry.label}
                disabled={entry.disabled}
                className={`dropdown-item ${
                  entry.intent === 'danger'
                    ? 'text-red-600 hover:bg-red-50 focus:bg-red-50'
                    : ''
                }`}
                onSelect={(e) => {
                  if (entry.disabled) {
                    e.preventDefault();
                    return;
                  }
                  entry.onSelect?.();
                }}
              >
                {entry.label}
              </DropdownMenu.Item>
            ),
          )}
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  );
};
