import { START, END, StateGraph, Send } from "@langchain/langgraph";
import { StateAnnotation } from "./state-annotation";
import { outlineNode, sectionNode, imageNode, assembleNode } from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("outline", outlineNode)
  .addNode("section", sectionNode)
  .addNode("image", imageNode)
  .addNode("assemble", assembleNode)

  .addEdge(START, "outline")
  .addConditionalEdges(
    "outline",
    (st) => {
      const sectionSends = st._outline.sections.map((section, idx) =>
        new Send("section", {
          _section: section,
          _payload: st._payload,
          _index: idx,
        })
      );
      const imageSend = new Send("image", {
        _thumbnail: st._outline.thumbnail,  
        _payload: st._payload,
      });
      return [...sectionSends, imageSend];
    },
    ["section", "image"]
  )

  .addEdge("section", "assemble")
  .addEdge("image", "assemble")

  .addEdge("assemble", END)
  .compile();
