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

      responses: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/prompts/responses`, query),
      },

      detail: {
        getHref: (
          businessId: string,
          promptId: string,
          query?: Record<string, any>,
        ) => buildPath(`/b/${businessId}/prompts/${promptId}`, query),
      },
    },

    onsite: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/onsite`, query),
    },

    playbook: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/playbook`, query),
    },

    workflows: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/workflows`, query),

      detail: {
        getHref: (
          businessId: string,
          workflowId: string,
          query?: Record<string, any>,
        ) => buildPath(`/b/${businessId}/workflows/${workflowId}`, query),

        settings: {
          getHref: (
            businessId: string,
            workflowId: string,
            query?: Record<string, any>,
          ) =>
            buildPath(
              `/b/${businessId}/workflows/${workflowId}/settings`,
              query,
            ),
        },
      },

      templates: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/workflows/templates`, query),
      },
    },

    integrations: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/integrations`, query),
    },

    brandKit: {
      getHref: (businessId: string, query?: Record<string, any>) =>
        buildPath(`/b/${businessId}/brand-kit/foundations`, query),

      foundations: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/brand-kit/foundations`, query),
      },

      productLines: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/brand-kit/product-lines`, query),

        detail: {
          getHref: (
            businessId: string,
            productId: string,
            query?: Record<string, any>,
          ) =>
            buildPath(
              `/b/${businessId}/brand-kit/product-lines/${productId}`,
              query,
            ),
        },
      },

      contentTypes: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/brand-kit/content-types`, query),

        detail: {
          getHref: (
            businessId: string,
            contentTypeId: string,
            query?: Record<string, any>,
          ) =>
            buildPath(
              `/b/${businessId}/brand-kit/content-types/${contentTypeId}`,
              query,
            ),
        },
      },

      audiences: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/brand-kit/audiences`, query),

        detail: {
          getHref: (
            businessId: string,
            audienceId: string,
            query?: Record<string, any>,
          ) =>
            buildPath(
              `/b/${businessId}/brand-kit/audiences/${audienceId}`,
              query,
            ),
        },
      },

      regions: {
        getHref: (businessId: string, query?: Record<string, any>) =>
          buildPath(`/b/${businessId}/brand-kit/regions`, query),

        detail: {
          getHref: (
            businessId: string,
            regionId: string,
            query?: Record<string, any>,
          ) =>
            buildPath(`/b/${businessId}/brand-kit/regions/${regionId}`, query),
        },
      },
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
