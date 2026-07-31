import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Document } from '@/types/api';

type DeleteDocumentDialogProps = {
  document?: Document;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteDocumentDialog({
  document,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDocumentDialogProps) {
  const isProcessing = document?.status === 'PROCESSING';

  return (
    <Dialog
      open={Boolean(document)}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!isDeleting}
        onEscapeKeyDown={(event) => {
          if (isDeleting) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isDeleting) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete this document?</DialogTitle>
          <DialogDescription>
            {isProcessing
              ? 'Wait for ingestion to finish before deleting this document.'
              : `“${document?.filename ?? document?.name}” will be removed from the knowledge base and search index permanently.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={isDeleting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isDeleting}
            disabled={isProcessing}
            onClick={onConfirm}
          >
            Delete document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
