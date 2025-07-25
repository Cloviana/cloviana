export const FAILED_EXCHANGE = "failed_exchange";

// Keywords
export const KEYWORDS_CLIENT = "KEYWORDS_CLIENT";
export const KEYWORDS_QUEUE = "keywords_queue";
export const KEYWORDS_SEEDED_EVENT = "keywords.seeded";
export const KEYWORDS_QUEUE_OPTS = {
  durable: true,
  autoDelete: false,
} as const;

// Billing
export const BILLING_CLIENT = "BILLING_CLIENT";
export const BILLING_QUEUE = "billing_queue";
export const BILLING_TRIAL_EXPIRED_EVENT = "billing.trial.expired";
export const BILLING_QUEUE_OPTS = {
  durable: true,
  autoDelete: false,
} as const;

// Blog
export const BLOGS_CLIENT = "BLOGS_CLIENT";
export const BLOGS_QUEUE = "blogs_queue";
export const GENERATE_BLOG_EVENT = "blog.generate";
export const BLOGS_QUEUE_OPTS = {
  durable: true,
  autoDelete: false,
} as const;
