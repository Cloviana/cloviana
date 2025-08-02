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
      getHref: (query?: Record<string, any>) =>
        buildPath('/auth/signup', query),
    },

    login: {
      getHref: (query?: Record<string, any>) => buildPath('/auth/login', query),
    },
  },

  store: {
    getHref: (storeId?: string, query?: Record<string, any>) =>
      buildPath(storeId ? `/store/${storeId}` : '/store', query),

    keywords: {
      getHref: (storeId: string, query?: Record<string, any>) =>
        buildPath(`/store/${storeId}/keywords`, query),
    },

    blogs: {
      getHref: (storeId: string, query?: Record<string, any>) =>
        buildPath(`/store/${storeId}/blogs`, query),

      steps: {
        topic: {
          getHref: (
            storeId: string,
            blogId: string,
            query?: Record<string, any>,
          ) =>
            buildPath(`/store/${storeId}/blogs/${blogId}/steps/topic`, query),
        },
      },
    },

    integrations: {
      getHref: (storeId: string, query?: Record<string, any>) =>
        buildPath(`/store/${storeId}/integrations`, query),
    },
  },

  editor: {
    getHref: (blogId: string, query?: Record<string, any>) =>
      buildPath(`/editor/${blogId}`, query),
  },

  onboarding: {
    companyDetail: {
      getHref: (query?: Record<string, any>) =>
        buildPath('/onboarding/company-detail', query),
    },
    trial: {
      getHref: (query?: Record<string, any>) =>
        buildPath('/onboarding/trial', query),
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
