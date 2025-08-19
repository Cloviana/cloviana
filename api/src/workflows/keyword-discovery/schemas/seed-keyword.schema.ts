import { z } from "zod";

export const SeedKeywordItemSchema = z.object({
  phrase: z.string().min(2),
});

export const SeedKeywordsSchema = z
  .object({
    items: z.array(SeedKeywordItemSchema).min(4).max(6),
  })
   .refine(({ items }) => items.length >= 4 && items.length <= 6, {
    message: "Must return between 4 and 6 seed keywords",
  });

export type SeedKeywordItem = z.infer<typeof SeedKeywordItemSchema>;
