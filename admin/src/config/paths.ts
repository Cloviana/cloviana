type PathQuery = Record<string, string> | URLSearchParams;

const buildPath = (path: string, query?: PathQuery) => {
  const params = new URLSearchParams(query);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
};

const marketplacePath = (slug: string) => `/mp/${encodeURIComponent(slug)}`;
const productsPath = (slug: string) => `${marketplacePath(slug)}/products`;

export const paths = {
  home: {
    getHref: (query?: PathQuery) => buildPath('/', query),
  },

  mp: {
    home: {
      getHref: (slug: string, query?: PathQuery) =>
        buildPath(marketplacePath(slug), query),
    },

    products: {
      getHref: (slug: string, query?: PathQuery) =>
        buildPath(productsPath(slug), query),
      create: {
        getHref: (slug: string, query?: PathQuery) =>
          buildPath(`${productsPath(slug)}/new`, query),
      },
      edit: {
        getHref: (slug: string, productId: string, query?: PathQuery) => {
          const params = new URLSearchParams(query);
          params.delete('action');
          params.delete('productId');
          return buildPath(
            `${productsPath(slug)}/${encodeURIComponent(productId)}`,
            params,
          );
        },
      },
      detail: {
        getHref: (slug: string, productId: string, query?: PathQuery) =>
          buildPath(
            `${productsPath(slug)}/${encodeURIComponent(productId)}`,
            query,
          ),
      },
    },

    offers: {
      getHref: (slug: string, query?: PathQuery) =>
        buildPath(`${productsPath(slug)}/offers`, query),
    },

    themes: {
      getHref: (slug: string, query?: PathQuery) =>
        buildPath(`${marketplacePath(slug)}/themes`, query),
      editor: {
        getHref: (slug: string, themeId: string, query?: PathQuery) =>
          buildPath(
            `${marketplacePath(slug)}/themes/${encodeURIComponent(themeId)}/editor`,
            query,
          ),
      },
    },

    stores: {
      getHref: (slug: string, query?: PathQuery) =>
        buildPath(`${marketplacePath(slug)}/stores`, query),
      create: {
        getHref: (slug: string, query?: PathQuery) =>
          buildPath(`${marketplacePath(slug)}/stores/new`, query),
      },
      detail: {
        getHref: (slug: string, storeId: string, query?: PathQuery) =>
          buildPath(
            `${marketplacePath(slug)}/stores/${encodeURIComponent(storeId)}`,
            query,
          ),
      },
    },

    categories: {
      getHref: (slug: string, query?: PathQuery) =>
        buildPath(`${productsPath(slug)}/categories`, query),
      edit: {
        getHref: (slug: string, categoryId: string, query?: PathQuery) =>
          buildPath(
            `${productsPath(slug)}/categories/${encodeURIComponent(categoryId)}`,
            query,
          ),
      },
    },
  },

  onboarding: {
    getHref: (query?: PathQuery) => buildPath('/onboarding', query),
  },

  auth: {
    signup: {
      getHref: (query?: PathQuery) => buildPath('/signup', query),
    },

    login: {
      getHref: (query?: PathQuery) => buildPath('/login', query),
    },
  },

  regulations: {
    termsOfService: {
      getHref: (query?: PathQuery) =>
        buildPath('https://cloviana.com/regulations/terms-of-service', query),
    },
    privacyPolicy: {
      getHref: (query?: PathQuery) =>
        buildPath('https://cloviana.com/regulations/privacy-policy', query),
    },
  },
} as const;
