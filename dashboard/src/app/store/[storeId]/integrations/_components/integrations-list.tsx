import React, { ReactNode } from 'react';

interface IntegrationsListProps {
  children: ReactNode;
}

export const IntegrationsList = ({ children }: IntegrationsListProps) => {
  return (
    <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
};
