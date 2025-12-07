import { Annotation } from "@langchain/langgraph";
import { Node } from "./schemas/node.schemas";
import { Outline } from "./schemas/outline.schemas";
import { Context } from "./schemas/context.schema";

export type Image = {
  url: string;
  alt: string;
};

export const StateAnnotation = Annotation.Root({
  _storeId: Annotation<string>(),
  _blogId: Annotation<string>(),

  _context: Annotation<Context>(),
  _outline: Annotation<Outline>(),

  _image: Annotation<Image>(),
  _nodes: Annotation<Node[]>(),
});
