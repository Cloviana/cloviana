import { env } from './env';

const buildPath = (path: string, query?: Record<string, any>) =>
  query && Object.keys(query).length
    ? `${path}?${new URLSearchParams(query as Record<string, string>).toString()}`
    : path;

export const paths = {
  home: {
    getHref: (query?: Record<string, any>) => buildPath('/', query),
  },

  blog: {
    getHref: (query?: Record<string, any>) => buildPath('/blog', query),
    post: {
      getHref: (slug: string, query?: Record<string, any>) =>
        buildPath(`/blog/${slug}`, query),
    },
  },

  auth: {
    login: {
      getHref: (query?: Record<string, any>) =>
        buildPath(`${env.APP_URL}/login`, query),
    },
    signup: {
      getHref: (query?: Record<string, any>) =>
        buildPath(`${env.APP_URL}/signup`, query),
    },
  },

  regulations: {
    termsOfService: {
      getHref: (query?: Record<string, any>) =>
        buildPath(`${env.WEB_URL}/regulations/terms-of-service`, query),
    },
    privacyPolicy: {
      getHref: (query?: Record<string, any>) =>
        buildPath(`${env.WEB_URL}/regulations/privacy-policy`, query),
    },
  },
} as const;
