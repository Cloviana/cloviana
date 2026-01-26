import { z } from "zod";

export const JsonValueSchema = z.unknown();

export const EditSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("set"),
    path: z.string().min(1),
    value: JsonValueSchema,
  }),
  z.object({
    op: z.literal("push"),
    path: z.string().min(1),
    value: JsonValueSchema,
  }),
  z.object({
    op: z.literal("removeAt"),
    path: z.string().min(1),
    index: z.number().int().min(0),
  }),
]);

export const EditsSchema = z.object({
  edits: z.array(EditSchema),
});

export type Edits = z.infer<typeof EditsSchema>;
