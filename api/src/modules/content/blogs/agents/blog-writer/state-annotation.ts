import { Annotation } from "@langchain/langgraph";
import { Outline } from "./schemas/outline";
import { NodePayload } from "./schemas/node";

export type Payload = {
  title: string;
  blogginKeyword: string;
  businessKeyword: string;
};
export type Section = { index: number; nodes: NodePayload[] };

export const StateAnnotation = Annotation.Root({
  _outline: Annotation<Outline>,
  _payload: Annotation<Payload>,
  _image: Annotation<string>,
  _nodes: Annotation<NodePayload[]>,
  _sections: Annotation<Section[]>({
    reducer: (state, update) => {
      const prev = Array.isArray(state) ? state : state ? [state] : [];
      const next = Array.isArray(update) ? update : [update];
      return [...prev, ...next];
    },
  }),
});
