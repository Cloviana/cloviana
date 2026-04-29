'use client';

import type { ReactNode } from 'react';

type BusinessSetupFooterProps = {
  description?: string;
  children?: ReactNode;
};

export function BusinessSetupFooter({
  description,
  children,
}: BusinessSetupFooterProps) {
  return (
    <div className="space-y-6">
      {description ? (
        <p className="text-foreground-lighter text-xs">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
