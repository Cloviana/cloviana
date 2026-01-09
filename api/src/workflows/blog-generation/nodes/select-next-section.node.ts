import { StateAnnotation } from "../blog-generation.state";

export async function selectNextSection(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const sections = state._outline?.sections ?? [];

  const sectionOrder =
    (state._sectionOrder?.length ?? 0) > 0
      ? state._sectionOrder!
      : sections
          .map((s) => s.sectionId)
          .filter((id): id is string => typeof id === "string" && id.length > 0);

  const drafts = state._sectionDrafts ?? {};

  const undrafted = sectionOrder.filter((id) => !(drafts[id]?.trim?.() ?? ""));

  return {
    _sectionOrder: sectionOrder,
    _currentSectionId: undrafted[0] ?? null,
    _nextSectionId: undrafted[1] ?? null,
    _sectionDrafts: drafts,
    _sectionRewriteIters: state._sectionRewriteIters ?? {},
  };
}
