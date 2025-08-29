import { z } from "zod";

export const SelectionByIdItemSchema = z.object({ id: z.string().min(1) });
export const SelectionByIdSchema = z.object({
  items: z.array(SelectionByIdItemSchema).min(50).max(50),
});
