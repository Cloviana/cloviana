const buildPath = (path: string, query?: Record<string, any>) =>
  query && Object.keys(query).length
    ? `${path}?${new URLSearchParams(query as Record<string, string>).toString()}`
    : path;

export const paths = {
  home: {
    getHref: (query?: Record<string, any>) => buildPath('/', query),
  },

  auth: {
    signup: {
      getHref: (query?: Record<string, any>) => buildPath('/signup', query),
    },

    login: {
      getHref: (query?: Record<string, any>) => buildPath('/login', query),
    },
  },

  business: {
    getHref: (businessId?: string, query?: Record<string, any>) =>
      buildPath(businessId ? `/b/${businessId}` : '/b', query),

    trial: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/trial`, query),
    },

    settings: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/settings`, query),

      subscription: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/settings/subscription`, query),
      },
    },
  },

  setup: {
    business: {
      getHref: (query?: Record<string, any>) =>
        buildPath('/setup/business', query),
      detail: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/setup/business/${businessId}`, query),
      },
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
