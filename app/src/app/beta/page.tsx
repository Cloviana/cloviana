'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { paths } from '@/config/paths';
import { useAcceptInvite } from '@/features/access/api/accept-invite';
import { useValidateInvite } from '@/features/access/api/validate-invite';

export default function InvitePage() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const {
    data,
    isLoading: isValidating,
    isError: validateError,
  } = useValidateInvite(token);
  const { mutate: accept, isError: acceptError } = useAcceptInvite({});

  const [manualError, setManualError] = useState(false);

  const isActiveStage =
    data?.storeStage === 'BETA' ||
    data?.storeStage === 'ACTIVE' ||
    data?.accepted === true;

  const shouldShowError =
    !token ||
    validateError ||
    acceptError ||
    manualError ||
    Boolean(data?.expired);

  useEffect(() => {
    if (!token || isValidating) return;
    if (validateError || data?.expired) return;
    if (isActiveStage && data?.storeId) {
      replace(paths.store.getHref(data.storeId));
      return;
    }
    if (data && !isActiveStage) {
      accept(token, {
        onSuccess: (res) => {
          if (res.storeId) replace(paths.store.getHref(res.storeId));
          else setManualError(true);
        },
        onError: () => setManualError(true),
      });
    }
  }, [
    token,
    data,
    isValidating,
    validateError,
    isActiveStage,
    accept,
    replace,
  ]);

  if (shouldShowError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <AlertTriangle className="size-7 text-yellow-600" />
          </div>
          <h1 className="mb-1 text-sm font-medium">
            We couldn’t process your invite
          </h1>
          <p className="text-foreground-light text-xs">
            This invite link may be invalid or expired. You can{' '}
            <Link
              href={paths.home.getHref()}
              className="text-primary underline"
            >
              return to the homepage
            </Link>{' '}
            or email{' '}
            <a
              href="mailto:support@cloviana.com"
              className="text-primary underline"
            >
              support@cloviana.com
            </a>{' '}
            for assistance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <span className="loading loading-spinner loading-md text-foreground"></span>
    </div>
  );
}
