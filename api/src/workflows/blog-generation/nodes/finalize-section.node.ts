import { Outline } from "@/workflows/blog-generation/schemas/outline";
import { StateAnnotation } from "../blog-generation.state";

type Section = Outline["sections"][number];

function normalizeParagraphSpacing(md: string): string {
  // Convert soft line breaks (two spaces + newline) into paragraph breaks
  let out = md.replace(/ {2,}\n/g, "\n\n");

  // Collapse 3+ newlines into exactly 2
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

function renderSectionStarter(section: Section): string {
  const lines: string[] = [];

  if ("heading" in section && section.heading) {
    lines.push(`## ${section.heading}`);
  }

  if ("contextualImage" in section) {
    const img = section.contextualImage;
    if (img?.url && img.altText) {
      lines.push(`![${img.altText}](${img.url})`);
    }
  }

  return lines.length ? lines.join("\n") + "\n\n" : "";
}

export async function finalizeSection(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("finalizeSection: _currentSectionId is null");

  const section = state._outline?.sections?.find(
    (s) => s.sectionId === sectionId,
  );
  if (!section)
    throw new Error(
      `finalizeSection: section not found sectionId=${sectionId}`,
    );

  const drafts = state._sectionDrafts ?? {};
  const body = drafts[sectionId];
  if (!body || !body.trim()) {
    throw new Error(
      `finalizeSection: missing draft for sectionId=${sectionId}`,
    );
  }

  const starter = renderSectionStarter(section);
  const normalizedBody = normalizeParagraphSpacing(body.trim());

  const finalMarkdown = (starter + normalizedBody).trim();

  return {
    _sectionDrafts: {
      ...drafts,
      [sectionId]: finalMarkdown,
    },
  };
}
