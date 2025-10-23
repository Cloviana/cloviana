import { Annotation } from "@langchain/langgraph";
import { Node } from "./schemas/node.schemas";
import { Outline, Thumbnail } from "./schemas/outline.schemas";

export type BlogMetadata = {
  title: string;
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  product?: {
    url: string;
    title: string;
    description: string;
  } | null;
  additionalInstruction?: string | null;
  brandVoice?: string | null;

  brandName: string;
  brandDescription?: string | null;
  blogLength: {
    min: number;
    max: number;
  };
};

export type Plan = {
  outline: Outline;
  thumbnail: Thumbnail;
  description: string
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
