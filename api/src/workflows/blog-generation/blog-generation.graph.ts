import { END, START, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./blog-generation.state";
import { initialize, outline, strategy, selectNextSection, writeSection, reviewSection, reviseSection, finalizeSection, assembleDraft, save } from "./nodes";

export const graph = new StateGraph(StateAnnotation)
  .addNode("intake", initialize)
  .addNode("content_strategy", strategy)
  .addNode("content_outline", outline)

  .addNode("select_next_section", selectNextSection)
  .addNode("write_section", writeSection)
  .addNode("review_section", reviewSection)
  .addNode("revise_section", reviseSection)
  .addNode("finalize_section", finalizeSection)

  .addNode("assemble_draft", assembleDraft)

  .addNode("save", save)

  .addEdge(START, "intake")
  .addEdge("intake", "content_strategy")
  .addEdge("content_strategy", "content_outline")
  .addEdge("content_outline", "select_next_section")

  .addConditionalEdges("select_next_section", (s) =>
    s._currentSectionId === null ? "assemble_draft" : "write_section"
  )
  
  .addEdge("write_section", "review_section")

  .addConditionalEdges("review_section", (s) => {
    if (s._sectionCritique.pass) return "finalize_section";
    if ((s._sectionRewriteIters[s._currentSectionId!] ?? 0) >= 2)
      return "finalize_section";
    return "revise_section";
  })

  .addEdge("revise_section", "review_section")
  .addEdge("finalize_section", "select_next_section")

  .addEdge("assemble_draft", "save")

  .addEdge("save", END)

  .compile();

