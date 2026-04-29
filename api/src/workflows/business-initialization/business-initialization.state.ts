import { Annotation } from "@langchain/langgraph";

export const StateAnnotation = Annotation.Root({
  _businessId: Annotation<string>(),
  _completedSteps: Annotation<string[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
});
