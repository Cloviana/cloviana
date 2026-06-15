import disposableEmailDomains from 'disposable-email-domains';
import { z } from 'zod';

const FREE_EMAIL_DOMAINS = new Set([
  'aol.com',
  'gmail.com',
  'gmx.com',
  'gmx.net',
  'hotmail.co.uk',
  'hotmail.com',
  'icloud.com',
  'live.com',
  'mac.com',
  'mail.com',
  'me.com',
  'msn.com',
  'outlook.co.uk',
  'outlook.com',
  'proton.me',
  'protonmail.com',
  'yahoo.co.uk',
  'yahoo.com',
  'yandex.com',
  'zoho.com',
]);

const DISPOSABLE_DOMAINS = new Set(disposableEmailDomains);

export function isWorkEmail(email: string) {
  const domain = email.trim().toLowerCase().split('@').at(-1);
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain) && !DISPOSABLE_DOMAINS.has(domain);
}

export const workEmailSchema = z
  .string()
  .trim()
  .email({ message: 'Enter a valid email.' })
  .refine(isWorkEmail, {
    message: 'Use your work email. Personal email providers are not accepted.',
  });
