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

    knowledgeBase: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/knowledge-base`, query),
    },

    prompts: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/prompts`, query),
    },

    skills: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/skills`, query),
    },

    integrations: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/integrations`, query),
    },

    brand: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/brand`, query),
    },

    competitors: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/competitors`, query),
    },

    chat: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/chat`, query),

      detail: {
        getHref: (
          businessId: string,
          chatId: string,
          query?: Record<string, any>,
        ) => buildPath(`/b/${businessId}/chat/${chatId}`, query),
      },
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
