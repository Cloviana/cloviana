import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const disposableEmailDomains = require("disposable-email-domains") as string[];

export const FREE_EMAIL_DOMAINS = new Set([
  "aol.com",
  "gmail.com",
  "gmx.com",
  "gmx.net",
  "hotmail.co.uk",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mac.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.co.uk",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.co.uk",
  "yahoo.com",
  "yandex.com",
  "zoho.com",
]);

const DISPOSABLE_EMAIL_DOMAINS = new Set<string>(disposableEmailDomains);

export function getEmailDomain(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  const separatorIndex = normalized.lastIndexOf("@");

  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) {
    return null;
  }

  return normalized.slice(separatorIndex + 1);
}

export function isWorkEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return Boolean(
    domain &&
      !FREE_EMAIL_DOMAINS.has(domain) &&
      !DISPOSABLE_EMAIL_DOMAINS.has(domain),
  );
}
