'use client';

import { useEffect } from 'react';

import { markLastAccessedBusiness } from '@/features/businesses/api/mark-last-accessed-business';

type BusinessAccessTrackerProps = {
  businessId: string;
};

export function BusinessAccessTracker({
  businessId,
}: BusinessAccessTrackerProps) {
  useEffect(() => {
    void markLastAccessedBusiness(businessId).catch(() => undefined);
  }, [businessId]);

  return null;
}
