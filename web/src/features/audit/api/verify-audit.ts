import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

export const verifyAuditInputSchema = z.object({
  email: z.string().email(),
  code: z.number().int().min(100000).max(999999),
});

export type VerifyAuditInput = z.infer<typeof verifyAuditInputSchema>;
type VerifyAuditResponse = { auditSlug: string };

export const verifyAudit = (data: VerifyAuditInput) =>
  api.post<VerifyAuditResponse>('/audits/verify', data);

type UseVerifyAuditOptions = {
  mutationConfig?: Omit<
    UseMutationOptions<VerifyAuditResponse, Error, VerifyAuditInput>,
    'mutationFn'
  >;
};

export const useVerifyAudit = ({
  mutationConfig,
}: UseVerifyAuditOptions = {}) =>
  useMutation({
    mutationFn: verifyAudit,
    ...mutationConfig,
  });
