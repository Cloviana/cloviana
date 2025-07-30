export const SHOPIFY_SCOPES = [
  'read_products',
  'write_products',
  'read_content',
  'write_content',
  'read_themes',
  'write_themes',
  'read_metaobjects',
  'write_metaobjects',
  'read_online_store_navigation',
  'write_online_store_navigation',
  'read_script_tags',
  'write_script_tags',
  'read_locales',
];

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 600,
};
