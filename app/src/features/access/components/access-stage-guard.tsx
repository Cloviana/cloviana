'use client';

import { AlertTriangle, Clock, MailOpen, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { FC, ReactNode } from 'react';

import { useGetStore } from '@/api/stores/get-store';
import { paths } from '@/config/paths';
import { AccessStage } from '@/types/api';

const StageMessage: FC<{
  icon: React.ReactNode;
  title: string;
  message: string;
}> = ({ icon, title, message }) => (
  <div className="grid min-h-full place-items-center px-6 py-16">
    <div className="w-full max-w-md text-center">
      <div className="mb-3 flex items-center justify-center">{icon}</div>
      <h2 className="text-foreground mb-1 text-sm font-medium">{title}</h2>
      <p className="text-foreground-light text-xs">
        {message}{' '}
        <Link href={paths.home.getHref()} className="text-primary underline">
          Return to the homepage
        </Link>{' '}
        or email{' '}
        <a
          href="mailto:support@cloviana.com"
          className="text-primary underline"
        >
          support@cloviana.com
        </a>{' '}
        for assistance. .
      </p>
    </div>
  </div>
);

const LoadingScreen = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <span className="loading loading-spinner loading-md text-foreground"></span>
  </div>
);

const stageConfig: Record<
  Exclude<AccessStage, 'ACTIVE' | 'BETA'>,
  { icon: React.ReactNode; title: string; message: string }
> = {
  INVITED: {
    icon: <MailOpen className="text-foreground size-7" />,
    title: 'Invitation required',
    message: 'Please accept your invite to continue.',
  },
  WAITLISTED: {
    icon: <Clock className="text-foreground size-7" />,
    title: "You're on the waitlist",
    message: 'We’ll notify you when access is available.',
  },
  REJECTED: {
    icon: <XCircle className="size-7 text-red-600" />,
    title: 'Access unavailable',
    message: 'This store doesn’t have access.',
  },
};

export const AccessStageGuard: FC<{ children: ReactNode }> = ({ children }) => {
  const { storeId } = useParams<{ storeId: string }>();
  const { data: store, isLoading, isError } = useGetStore(storeId);

  if (isLoading) return <LoadingScreen />;

  if (isError || !store) {
    return (
      <StageMessage
        icon={<AlertTriangle className="size-7 text-yellow-600" />}
        title="Unable to load store"
        message="We couldn't load this store."
      />
    );
  }

  const stage = store.stage as AccessStage;
  if (stage === 'ACTIVE' || stage === 'BETA') return <>{children}</>;

  const cfg = stageConfig[stage as Exclude<AccessStage, 'ACTIVE' | 'BETA'>];
  if (cfg)
    return (
      <StageMessage icon={cfg.icon} title={cfg.title} message={cfg.message} />
    );

  return <>{children}</>;
};
