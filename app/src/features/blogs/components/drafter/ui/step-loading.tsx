import { Spinner } from '@/components/ui/spinner';

export const StepLoading = ({ ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      {...props}
    >
      <Spinner
        className="text-foreground-light size-7"
        strokeWidth={3.4}
        variant="2"
      />
    </div>
  );
};
