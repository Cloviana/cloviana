import { FC, ReactNode } from 'react';

interface SplitLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export const SplitLayout: FC<SplitLayoutProps> = ({ left, right }) => {
  return (
    <div className="relative mx-auto flex w-full max-w-[1540px] flex-col items-center gap-8 p-8 lg:h-svh lg:flex-row lg:gap-0">
      <div className="flex h-full max-h-[900px] flex-1 justify-center text-black lg:p-16">
        {left}
      </div>

      <div className="relative hidden h-full max-h-[900px] flex-1 justify-center rounded-xl bg-surface-200 p-8 text-white lg:flex lg:p-16">
        {right}
      </div>
    </div>
  );
};
