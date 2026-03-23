export const FAILED_EXCHANGE = "failed_exchange";

// Keywords
export const KEYWORDS_CLIENT = "KEYWORDS_CLIENT";
export const KEYWORDS_QUEUE = "keywords_queue";
export const KEYWORDS_SEEDED_EVENT = "keywords.seeded";
export const KEYWORDS_QUEUE_OPTS = {
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

// Stores
export const STORES_CLIENT = "STORES_CLIENT";
export const STORES_QUEUE = "stores_queue";
export const INIT_STORES_EVENT = "store.init";
export const STORES_QUEUE_OPTS = {
  durable: true,
  autoDelete: false,
} as const;

// Products
export const PRODUCTS_CLIENT = "PRODUCTS_CLIENT";
export const PRODUCTS_QUEUE = "products_queue";
export const SYNC_PRODUCTS_EVENT = "products.sync";
export const PRODUCTS_QUEUE_OPTS = {
  durable: true,
  autoDelete: false,
} as const;

// Audits
export const AUDITS_CLIENT = "AUDITS_CLIENT";
export const AUDITS_QUEUE = "audits_queue";
export const RUN_AUDIT_EVENT = "audit.run";
export const AUDITS_QUEUE_OPTS = {
  durable: true,
  autoDelete: false,
} as const;
