import type { DeepOutputSchema } from "exa-js";

export const businessProfileOutputSchema: DeepOutputSchema = {
  type: "object",
  required: ["name", "description", "icp", "category"],
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    icp: { type: "string" },
    category: { type: "string" },
  },
};
