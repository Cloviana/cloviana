import { ReactNode } from 'react';

import { BlogInstanceProvider } from './provider';

interface LayoutProps {
  children?: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <BlogInstanceProvider>{children}</BlogInstanceProvider>;
}
