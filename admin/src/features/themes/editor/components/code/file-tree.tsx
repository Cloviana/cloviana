'use client';

import { ChevronRight, File } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import type { TreeNode } from '../../lib/file-tree';

const INDENT_REM = 0.75;

function TreeRow({
  node,
  depth,
  selected,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const isFolder = node.children !== null;
  const active = selected === node.path;

  return (
    <li
      role="treeitem"
      aria-expanded={isFolder ? open : undefined}
      aria-selected={active}
    >
      <button
        type="button"
        onClick={() => (isFolder ? setOpen(!open) : onSelect(node.path))}
        style={{ paddingLeft: `${0.5 + depth * INDENT_REM}rem` }}
        className={cn(
          'text-body text-text-default focus-visible:ring-border-focused flex h-7 w-full items-center gap-1 rounded-md pr-2 text-left outline-none focus-visible:ring-(length:--ds-border-width-focused) focus-visible:ring-inset',
          active
            ? 'bg-background-selected text-text-selected'
            : 'hover:bg-surface-hovered',
        )}
      >
        {isFolder ? (
          <ChevronRight
            className={cn(
              'text-icon-subtle size-4 shrink-0 transition-transform',
              open && 'rotate-90',
            )}
          />
        ) : (
          <File className="text-icon-subtle size-4 shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && open && (
        <ul role="group">
          {node.children!.map((child) => (
            <TreeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FileTree({
  nodes,
  selected,
  onSelect,
}: {
  nodes: TreeNode[];
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  return (
    <ul role="tree" aria-label="Theme files" className="p-2">
      {nodes.map((node) => (
        <TreeRow
          key={node.path}
          node={node}
          depth={0}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}
