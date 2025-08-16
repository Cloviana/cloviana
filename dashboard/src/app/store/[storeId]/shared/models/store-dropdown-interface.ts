export type MenuEntry =
  | {
      type: 'item';
      label: string;
      intent?: 'default' | 'danger';
      disabled?: boolean;
      onSelect?: () => void;
    }
  | { type: 'separator' };
