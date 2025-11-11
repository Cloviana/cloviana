import { z } from "zod";

export const ProductsSchema = z.object({
  recommendedIds: z.array(z.string()).min(1).max(3),
});
export type Products = z.infer<typeof ProductsSchema>;
