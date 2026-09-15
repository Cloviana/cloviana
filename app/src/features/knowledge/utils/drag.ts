import type { DragEvent } from 'react';

// A custom type keeps folder drops from reacting to files dragged in from the
// desktop — those are the dropzone's job.
const DOCUMENT_DRAG_TYPE = 'application/x-cloviana-document';

export function startDocumentDrag(
  event: DragEvent<HTMLElement>,
  documentId: string,
) {
  event.dataTransfer.setData(DOCUMENT_DRAG_TYPE, documentId);
  event.dataTransfer.effectAllowed = 'move';
}

export function isDocumentDrag(event: DragEvent<HTMLElement>) {
  return event.dataTransfer.types.includes(DOCUMENT_DRAG_TYPE);
}

export function getDraggedDocumentId(event: DragEvent<HTMLElement>) {
  return event.dataTransfer.getData(DOCUMENT_DRAG_TYPE) || undefined;
}
