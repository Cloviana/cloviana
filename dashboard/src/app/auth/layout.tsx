import { FC, ReactNode } from 'react';

import AuthLayout from './_components/auth-layout';

interface LayoutProps {
  children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ children }) => {
  return <AuthLayout>{children}</AuthLayout>;
};

export default Layout;
