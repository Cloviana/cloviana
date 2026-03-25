import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';

const FREE_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'protonmail.com',
  'aol.com',
  'mail.com',
  'live.com',
  'msn.com',
  'ymail.com',
  'googlemail.com',
];

export const requestAuditInputSchema = z.object({
  domain: z.string().min(1, 'Enter your site URL.'),
  email: z
    .string()
    .email({ message: 'Enter a valid email.' })
    .refine(
      (val) => {
        const domain = val.split('@')[1]?.toLowerCase();
        return domain ? !FREE_PROVIDERS.includes(domain) : false;
      },
      { message: 'Please use your work email.' },
    ),
  country: z.string().length(2),
});

export type RequestAuditInput = z.infer<typeof requestAuditInputSchema>;

export const requestAudit = (data: RequestAuditInput) =>
  api.post<{ message: string }>('/audits/request', data);

type UseRequestAuditOptions = {
  mutationConfig?: Omit<
    UseMutationOptions<{ message: string }, Error, RequestAuditInput>,
    'mutationFn'
  >;
};

export const useRequestAudit = ({
  mutationConfig,
}: UseRequestAuditOptions = {}) =>
  useMutation({
    mutationFn: requestAudit,
    ...mutationConfig,
  });
