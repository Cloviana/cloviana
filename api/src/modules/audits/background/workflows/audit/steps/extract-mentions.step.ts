import { extractMentions } from "@/common/visibility/extract-mentions";
import type { AuditInput, EngineResult } from "../audit.types";

export function extractMentionsStep(
  input: AuditInput,
  responses: EngineResult[],
): EngineResult[] {
  const brands = [
    {
      name: input.profile.name,
      domain: input.profile.domain,
      aliases: input.profile.aliases,
    },
    ...input.competitors.map(({ name, domain, aliases }) => ({
      name,
      domain,
      aliases,
    })),
  ];
  const brandNameByDomain = new Map(
    brands.map((brand) => [brand.domain, brand.name]),
  );

  return responses.map((response) => ({
    ...response,
    mentions: extractMentions(response.text, brands).map(
      ({ domain, position }) => ({
        domain,
        position,
        name: brandNameByDomain.get(domain) ?? domain,
      }),
    ),
  }));
}
