'use client';

import { createPlatePlugin } from 'platejs/react';

import { FixedToolbar } from '@/components/editor/components/toolbars/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/editor/components/toolbars/fixed-toolbar-buttons';

export const FixedToolbarKit = [
  createPlatePlugin({
    key: 'fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <FixedToolbarButtons />
        </FixedToolbar>
      ),
    },
  }),
];
