/**
 * What every new marketplace starts with, created in the same transaction as the marketplace
 * so it never exists half set up.
 */

// Seller members need a role to be invited with. Permission names are defined with the vendor
// panel; until then "*" means everything.
export const DEFAULT_ROLE = {
  name: "Admin",
  description: "Full access to the seller workspace",
  permissions: ["*"],
} as const;

// Placeholder: the owner changes it in settings. A default rate must exist so commission lines
// can always be calculated when an order is split.
export const DEFAULT_COMMISSION_RATE = {
  name: "Default commission",
  code: "default",
  percentage: "10",
} as const;

// Per-marketplace human-readable numbers (order #1001).
export const SEQUENCE_NAMES = [
  "ORDER_GROUP",
  "ORDER",
  "PAYOUT",
  "REVIEW",
] as const;
