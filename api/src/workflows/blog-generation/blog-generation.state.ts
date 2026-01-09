import { Annotation } from "@langchain/langgraph";
import { Node } from "./schemas/node.schemas";
import { Outline } from "./schemas/outline.schemas";
import { Context } from "./schemas/context.schema";
import { ContentStrategy } from "./schemas/strategy.schema";
import { ReviewSection } from "@/workflows/blog-generation/schemas/review-section.schema";

export type Image = {
  url: string;
  alt: string;
};

export const StateAnnotation = Annotation.Root({
  _storeId: Annotation<string>(),
  _blogId: Annotation<string>(),

  _context: Annotation<Context>(),
  _strategy: Annotation<ContentStrategy>(),

  _outline: Annotation<Outline>(),

  _draft: Annotation<string>(),

  _image: Annotation<Image>(),
  _nodes: Annotation<Node[]>(),

  _sectionOrder: Annotation<string[]>(),
  _currentSectionId: Annotation<string | null>(),
  _nextSectionId: Annotation<string | null>(),

  _sectionDrafts: Annotation<Record<string, string>>(),
  _sectionRewriteIters: Annotation<Record<string, number>>(),
  _sectionCritique: Annotation<ReviewSection>(),
});
