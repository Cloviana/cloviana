export interface ResolvedStorefront {
  name: string;
  slug: string;
  status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
}

export abstract class StorefrontResolver {
  abstract resolveHost(
    host: string | undefined,
  ): Promise<ResolvedStorefront | null>;
}
