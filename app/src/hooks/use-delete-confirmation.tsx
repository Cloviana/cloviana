'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type DeleteConfirmationOptions = {
  title: ReactNode;
  description: ReactNode;
  confirmLabel?: ReactNode;
  onConfirm: () => unknown | Promise<unknown>;
};

type ConfirmDelete = (options: DeleteConfirmationOptions) => void;

const DeleteConfirmationContext = createContext<ConfirmDelete | null>(null);

export function DeleteConfirmationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [confirmation, setConfirmation] =
    useState<DeleteConfirmationOptions | null>(null);
  const [isPending, setIsPending] = useState(false);

  const confirmDelete = useCallback<ConfirmDelete>((options) => {
    setConfirmation(options);
  }, []);

  async function handleConfirm() {
    if (!confirmation) return;

    setIsPending(true);
    try {
      await confirmation.onConfirm();
      setConfirmation(null);
    } catch {
      // Mutation error handling stays with the caller.
    } finally {
      setIsPending(false);
    }
  }

  return (
    <DeleteConfirmationContext.Provider value={confirmDelete}>
      {children}
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open && !isPending) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              loading={isPending}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
            >
              {confirmation?.confirmLabel ?? 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DeleteConfirmationContext.Provider>
  );
}

export function useDeleteConfirmation() {
  const confirmDelete = useContext(DeleteConfirmationContext);

  if (!confirmDelete) {
    throw new Error(
      'useDeleteConfirmation must be used within DeleteConfirmationProvider',
    );
  }

  return confirmDelete;
}
