import { Annotation } from "@langchain/langgraph";
import { Node } from "./schemas/node.schemas";
import { Plan } from "./schemas/outline.schemas";

export type BlogMetadata = {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  products: {
    url: string;
    title: string;
    description: string;
  }[];
  collections: {
    url: string;
    title: string;
    description: string;
  }[];
  targetPersona: string;
  searchIntent: string;
  brandVoice?: string | null;

  brandName: string;
  brandDescription?: string | null;
  blogLength: {
    min: number;
    max: number;
  };
};

export type Image = {
  url: string;
  alt: string;
};

export const StateAnnotation = Annotation.Root({
  _storeId: Annotation<string>(),
  _blogId: Annotation<string>(),
  _metadata: Annotation<BlogMetadata>(),
  _plan: Annotation<Plan>(),

  _image: Annotation<Image>(),
  _nodes: Annotation<Node[]>(),
});
