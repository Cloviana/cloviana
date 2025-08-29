import type { CodegenConfig } from "@graphql-codegen/cli";

const version = "2025-07";

const config: CodegenConfig = {
  schema: `https://shopify.dev/admin-graphql-direct-proxy/${version}`,
  documents: ["src/clients/shopify/queries/**/*.graphql"],
  generates: {
    "src/clients/shopify/generated.ts": {
      plugins: ["typescript", "typescript-operations", "typed-document-node"],
      config: {
        skipTypename: true,
        enumsAsTypes: true,
        scalars: {
          DateTime: "string",
          HTML: "string",
          URL: "string",
          Decimal: "string",
          UnsignedInt64: "string",
          Count: "number",
        },
      },
    },
  },
};

export default config;
