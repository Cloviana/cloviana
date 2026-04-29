import type { GoogleSerpResult } from "@/integrations/dataforseo/dataforseo.types";

type GoogleSerpTaskResult = Partial<GoogleSerpResult> & {
  fan_out_queries?: string[];
};

export function extractFanOutQueries(
  taskResult?: GoogleSerpTaskResult | null,
): string[] {
  return (taskResult?.fan_out_queries ?? []).filter((query): query is string =>
    Boolean(query?.trim()),
  );
}
