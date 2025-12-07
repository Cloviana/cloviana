'use client';

import { Check, Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useDrafter } from '@/features/blogs/components/drafter/drafter-context';
import { STEPS_CONFIG } from '@/features/blogs/components/drafter/drafter.config';
import { cn } from '@/utils/cn';

const StepButton = ({ step }: { step: (typeof STEPS_CONFIG)[number] }) => {
  const { isStepCompleted, canGoTo, goTo, currentKey } = useDrafter();

  const isCompleted = isStepCompleted(step.key);
  const isCurrent = currentKey === step.key;

  return (
    <button
      disabled={!canGoTo(step.key)}
      onClick={() => goTo(step.key)}
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-lg border px-3.5',
        isCurrent ? 'bg-accent' : 'hover:bg-accent bg-zinc-50/60',
        !canGoTo(step.key) && 'pointer-events-none opacity-65',
      )}
    >
      <div
        className={cn(
          'flex size-3.5 items-center justify-center rounded-full text-white',
          isCompleted ? 'bg-secondary' : 'border bg-white',
        )}
      >
        {isCompleted && <Check className="size-2" strokeWidth={3} />}
      </div>
      <div className="flex items-center gap-2">
        <step.icon className="size-3.5" strokeWidth={2.7} />
        <span className="text-sm font-semibold text-nowrap">{step.title}</span>
      </div>
    </button>
  );
};

const SidebarBody = () => {
  const { steps } = useDrafter();
  return (
    <div className="size-full">
      <div className="space-y-1">
        <h1 className="text-sm font-medium">AI Content Writer</h1>
        <p className="text-foreground-light text-xs">
          Set up your blog details so Cloviana’s AI can craft a product-led
          article that fits your brand, keywords, and goals.
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {steps.map((step) => (
          <StepButton key={step.key} step={step} />
        ))}
      </div>
    </div>
  );
};

export const Sidebar = ({
  className,
  ...props
}: React.ComponentProps<'aside'>) => {
  const { isMobile, openMobile, setOpenMobile } = useDrafter();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          side="bottom"
          className="flex h-[85dvh] flex-col rounded-t-2xl p-0 [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Draft sidebar</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <SidebarBody />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      {...props}
      className={cn(
        'hidden h-full w-full max-w-md overflow-hidden border-r px-4 py-5 md:block',
        className,
      )}
    >
      <SidebarBody />
    </aside>
  );
};

export function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { setOpenMobile } = useDrafter();
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn('size-7', className)}
      onClick={(e) => {
        onClick?.(e);
        setOpenMobile((v) => !v);
      }}
      {...props}
    >
      <Menu />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
