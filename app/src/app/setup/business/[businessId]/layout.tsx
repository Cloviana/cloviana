import { type ReactNode } from 'react';

type BusinessSetupLayoutProps = {
  children: ReactNode;
};

export default async function BusinessSetupLayout({
  children,
}: BusinessSetupLayoutProps) {
  return <>{children}</>;
}
