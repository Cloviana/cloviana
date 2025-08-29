import { Annotation } from "@langchain/langgraph";
import { HeadingNode, Node } from "./schemas/node.schemas";
import { Section, Thumbnail } from "./schemas/outline.schemas";

export type BlogMetadata = {
  title: string;
  topic: string;
  keyword: string;
  brandVoice?: string | null;
  brandName: string;
  brandDescription?: string | null;
  blogLength: {
    min: number;
    max: number;
  };
};

export type Outline = {
  sections: Section[];
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
  _headings: Annotation<HeadingNode[]>(),
  _outline: Annotation<Outline>(),
  _image: Annotation<Image>(),
  _nodes: Annotation<Node[]>(),
});
