const buildPath = (path: string, query?: Record<string, any>) =>
  query && Object.keys(query).length
    ? `${path}?${new URLSearchParams(query as Record<string, string>).toString()}`
    : path;

export const paths = {
  home: {
    getHref: (query?: Record<string, any>) => buildPath('/', query),
  },

  auth: {
    login: {
      getHref: (query?: Record<string, any>) =>
        buildPath(`https://dashboard.cloviana.com/auth/login`, query),
    },
    signup: {
      getHref: (query?: Record<string, any>) =>
        buildPath(`https://dashboard.cloviana.com/auth/signup`, query),
    },
  },

  regulations: {
    termsOfService: {
      getHref: (query?: Record<string, any>) =>
        buildPath('https://cloviana.com/regulations/terms-of-service', query),
    },
    privacyPolicy: {
      getHref: (query?: Record<string, any>) =>
        buildPath('https://cloviana.com/regulations/privacy-policy', query),
    },
  },
} as const;
