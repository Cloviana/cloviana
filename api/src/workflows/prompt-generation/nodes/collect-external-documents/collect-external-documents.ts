import { PromptGenerationNodeConfig } from "../../prompt-generation.config";
import { StateAnnotation } from "../../prompt-generation.state";
import { collectForumDocuments } from "./forum-documents";
import { collectReviewDocuments } from "./review-documents";
import { dedupeDocuments } from "./search-documents";

export async function collectExternalDocuments(
  state: typeof StateAnnotation.State,
  config: PromptGenerationNodeConfig,
): Promise<Partial<typeof StateAnnotation.State>> {
  config.configurable?.logger?.debug(
    `[${state._businessId}] Collecting external documents for ${state.profile.name} with ${state.competitors.length} competitors`,
  );

  const [reviewDocs, forumDocs] = await Promise.all([
    collectReviewDocuments(state, config),
    collectForumDocuments(state, config),
  ]);

  const docs = dedupeDocuments([...state.docs, ...reviewDocs, ...forumDocs]);

  config.configurable?.logger?.debug(
    `[${state._businessId}] External document collection complete: existing=${state.docs.length} reviews=${reviewDocs.length} forums=${forumDocs.length} deduped=${docs.length}`,
  );

  return { docs };
}
