import * as Dialog from '@radix-ui/react-dialog';

type SubscriptionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({
  open,
  onOpenChange,
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/30" />
      <Dialog.Content className="fixed left-1/2 top-1/2 flex w-[1000px] max-w-full -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white">
        <div className="w-1/2 bg-primary-light p-6"></div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
