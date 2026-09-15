'use client';

import { createPlatePlugin } from 'platejs/react';

import { FloatingToolbar } from '@/components/editor/components/toolbars/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/editor/components/toolbars/floating-toolbar-buttons';

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <FloatingToolbarButtons />
        </FloatingToolbar>
      ),
    },
  }),
];
