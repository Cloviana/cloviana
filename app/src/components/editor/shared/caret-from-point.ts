export function caretFromPoint(
  x: number,
  y: number,
): null | {
  offset: number;
  node: Node;
} {
  const doc = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
  };

  if (typeof doc.caretRangeFromPoint === 'function') {
    const range = doc.caretRangeFromPoint(x, y);
    if (range === null) {
      return null;
    }
    return {
      node: range.startContainer,
      offset: range.startOffset,
    };
  } else if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos === null) {
      return null;
    }
    return {
      node: pos.offsetNode,
      offset: pos.offset,
    };
  } else {
    return null;
  }
}
