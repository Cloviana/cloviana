import { TODO } from "@/workflows/blog-generation/schemas/outline";

export function findTodoPaths(
  value: unknown,
  {
    todoToken = TODO,
    rootPath = "",
  }: { todoToken?: string; rootPath?: string } = {},
): string[] {
  const paths: string[] = [];

  const walk = (node: unknown, path: string) => {
    if (node === todoToken) {
      paths.push(path || rootPath || "$");
      return;
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        walk(node[i], path ? `${path}.${i}` : `${i}`);
      }
      return;
    }

    if (node && typeof node === "object") {
      for (const [key, child] of Object.entries(
        node as Record<string, unknown>,
      )) {
        walk(child, path ? `${path}.${key}` : key);
      }
    }
  };

  walk(value, rootPath);
  return paths;
}
