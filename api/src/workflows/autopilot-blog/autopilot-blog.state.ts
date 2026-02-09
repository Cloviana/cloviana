import { Annotation } from "@langchain/langgraph";
export const StateAnnotation = Annotation.Root({
  _storeId: Annotation<string>(),

  _blogId: Annotation<string>(),
});
