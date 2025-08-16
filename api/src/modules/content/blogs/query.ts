export const LIST_BLOGS = `query { blogs(first: 50) { nodes { id title } } }`;

export const FIND_ARTICLE = `
  query GetArticle($blogId: ID!, $handle: String!) {
    node(id: $blogId) {
      ... on Blog {
        articleByHandle(handle: $handle) {
          id
          handle
        }
      }
    }
  }
`;

export const CREATE_ARTICLE = `
  mutation CreateArticle($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article { id }
      userErrors { field message }
    }
  }
`;

export const UPDATE_ARTICLE = `
  mutation UpdateArticle($id: ID!, $article: ArticleUpdateInput!) {
    articleUpdate(id: $id, article: $article) {
      article { id }
      userErrors { field message }
    }
  }
`;
