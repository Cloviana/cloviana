import type { SourceFile } from '../types';

export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[] | null; // null marks a file
}

function sortNodes(nodes: TreeNode[]) {
  nodes.sort((a, b) => {
    if (!a.children !== !b.children) return a.children ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const node of nodes) if (node.children) sortNodes(node.children);
  return nodes;
}

export function buildFileTree(files: SourceFile[]) {
  const root: TreeNode[] = [];
  for (const { path } of files) {
    let level = root;
    const parts = path.split('/');
    parts.forEach((name, index) => {
      const isFile = index === parts.length - 1;
      let node = level.find((n) => n.name === name);
      if (!node) {
        node = {
          name,
          path: parts.slice(0, index + 1).join('/'),
          children: isFile ? null : [],
        };
        level.push(node);
      }
      if (node.children) level = node.children;
    });
  }
  return sortNodes(root);
}
