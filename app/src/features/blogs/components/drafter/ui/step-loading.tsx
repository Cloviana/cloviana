import { Spinner } from '@/components/ui/spinner';

export const StepLoading = ({ ...props }: React.ComponentProps<'div'>) => {
  return (
    <div className="flex h-full items-center justify-center" {...props}>
      <Spinner className="text-foreground-light size-5" />
    </div>
  );
};
