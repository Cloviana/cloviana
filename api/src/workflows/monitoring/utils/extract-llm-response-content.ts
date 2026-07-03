import type { LlmResponseItem } from "@/integrations/dataforseo/dataforseo.types";
import type { Citation } from "../monitoring.types";

export function extractLlmResponseContent(items: LlmResponseItem[] = []): {
  content: string;
  citations: Citation[];
} {
  const sections = items
    .filter((item) => item.type === "message")
    .flatMap((item) => item.sections);

  return {
    content: sections.map((section) => section.text ?? "").join("\n\n"),
    citations: sections
      .flatMap((section) => section.annotations ?? [])
      .filter((annotation): annotation is Citation => Boolean(annotation?.url))
      .map((annotation) => ({ url: annotation.url, title: annotation.title ?? "" })),
  };
}
