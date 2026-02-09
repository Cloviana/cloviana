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

  store: {
    getHref: (storeId?: string, query?: Record<string, any>) =>
      buildPath(storeId ? `/${storeId}` : '/', query),

    blogs: {
      getHref: (
        storeId: string,
        blogId?: string,
        query?: Record<string, any>,
      ) => buildPath(`/${storeId}/blogs${blogId ? `/${blogId}` : ''}`, query),

      editor: {
        getHref: (
          storeId: string,
          blogId: string,
          query?: Record<string, any>,
        ) => buildPath(`/${storeId}/blogs/${blogId}/editor`, query),
      },
    },

    settings: {
      getHref: (storeId: string, query?: Record<string, any>) =>
        buildPath(`/${storeId}/settings`, query),

      integrations: {
        getHref: (storeId: string, query?: Record<string, any>) =>
          buildPath(`/${storeId}/settings/integrations`, query),
      },

      autopilot: {
        getHref: (storeId: string, query?: Record<string, any>) =>
          buildPath(`/${storeId}/settings/autopilot`, query),
      },
    },
  },

  onboarding: {
    getHref: (query?: Record<string, any>) => buildPath('/onboarding', query),
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
