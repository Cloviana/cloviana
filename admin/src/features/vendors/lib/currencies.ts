export const CURRENCY_CODES = ['USD', 'EUR', 'GBP'] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export const currencyLabels: Record<CurrencyCode, string> = {
  USD: 'US dollar (USD)',
  EUR: 'Euro (EUR)',
  GBP: 'British pound (GBP)',
};
