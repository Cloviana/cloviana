import { StateAnnotation } from "../blog-generation.state";

export async function finalizeSection(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const sectionId = state._currentSectionId;
  if (!sectionId) throw new Error("finalizeSection: _currentSectionId is null");

  const drafts = state._sectionDrafts ?? {};
  const sectionMarkdown = drafts[sectionId];
  if (!sectionMarkdown || !sectionMarkdown.trim()) {
    throw new Error(`finalizeSection: missing draft for sectionId=${sectionId}`);
  }

  return {};
}
