'use client';

import {
  Background,
  Controls,
  type Edge,
  type Node,
  ReactFlow,
} from '@xyflow/react';
import type { CSSProperties } from 'react';

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function WorkflowCanvas() {
  return (
    <div className="bg-background min-h-0 flex-1">
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background />
        <Controls
          className="border-border overflow-hidden rounded-md border"
          style={
            {
              '--xy-controls-box-shadow': 'none',
              '--xy-controls-button-background-color': 'var(--surface)',
              '--xy-controls-button-background-color-hover': 'var(--accent)',
              '--xy-controls-button-color': 'var(--foreground)',
              '--xy-controls-button-color-hover': 'var(--foreground)',
              '--xy-controls-button-border-color': 'var(--border)',
            } as CSSProperties
          }
        />
      </ReactFlow>
    </div>
  );
}
