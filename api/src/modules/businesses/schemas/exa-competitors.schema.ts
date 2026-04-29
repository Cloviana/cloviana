import type { DeepOutputSchema } from "exa-js";

export const competitorsOutputSchema: DeepOutputSchema = {
  type: "object",
  required: ["competitors"],
  properties: {
    competitors: {
      type: "array",
      items: {
        type: "object",
        required: ["domain", "title"],
        properties: {
          domain: { type: "string" },
          title: { type: "string" },
        },
      },
    },
  },
};
