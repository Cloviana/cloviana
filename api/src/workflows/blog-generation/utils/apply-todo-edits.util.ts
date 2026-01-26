type AnyObj = Record<string, any>;

function splitPath(path: string): string[] {
  return path.split(".").filter(Boolean);
}

function pathMatchesPattern(pattern: string, path: string): boolean {
  const p = splitPath(pattern);
  const s = splitPath(path);
  if (p.length !== s.length) return false;

  for (let i = 0; i < p.length; i += 1) {
    if (p[i] === "*") continue;
    if (p[i] !== s[i]) return false;
  }
  return true;
}

function pathMatches(editablePaths: string[], path: string): boolean {
  for (const pat of editablePaths) {
    if (pathMatchesPattern(pat, path)) return true;
  }
  return false;
}

function getAt(obj: any, path: string): any {
  const segs = splitPath(path);
  let cur = obj;
  for (const s of segs) {
    if (cur == null) return undefined;
    if (Array.isArray(cur)) {
      const idx = Number(s);
      if (!Number.isInteger(idx)) return undefined;
      cur = cur[idx];
    } else {
      cur = cur[s];
    }
  }
  return cur;
}

function setAt(obj: any, path: string, value: any): void {
  const segs = splitPath(path);
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i += 1) {
    const s = segs[i];
    if (Array.isArray(cur)) cur = cur[Number(s)];
    else cur = cur[s];
  }
  const last = segs[segs.length - 1];
  if (Array.isArray(cur)) cur[Number(last)] = value;
  else cur[last] = value;
}

function canSet(current: any, todoToken: string): boolean {
  if (current === todoToken) return true;
  if (Array.isArray(current)) {
    if (current.length === 0) return true;
    return current.every((v) => v === todoToken);
  }
  return false;
}

export function applyTodoEdits<T extends AnyObj>(args: {
  skeleton: T;
  edits: {
    op: "set" | "push" | "removeAt";
    path: string;
    value?: any;
    index?: number;
  }[];
  editablePaths: string[];
  todoToken: string;
}): T {
  const out = structuredClone(args.skeleton) as T;

  for (const e of args.edits) {
    if (!pathMatches(args.editablePaths, e.path)) continue;

    const current = getAt(out, e.path);

    if (e.op === "set") {
      if (!canSet(current, args.todoToken)) continue;
      setAt(out, e.path, e.value);
      continue;
    }

    if (e.op === "push") {
      if (!Array.isArray(current)) continue;

      if (Array.isArray(e.value)) {
        for (const v of e.value) current.push(v);
      } else {
        current.push(e.value);
      }
      continue;
    }

    if (e.op === "removeAt") {
      if (!Array.isArray(current)) continue;
      if (typeof e.index !== "number") continue;
      if (e.index < 0 || e.index >= current.length) continue;

      const next = current.slice(0, e.index).concat(current.slice(e.index + 1));
      setAt(out, e.path, next);
      continue;
    }
  }

  return out;
}
