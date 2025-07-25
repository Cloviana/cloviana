import { z } from "zod";

export const TextLeafSchema = z.object({
  text: z.string().min(1),
  bold: z.boolean(),
  italic: z.boolean(),
  underline: z.boolean(),

  link: z
    .object({
      href: z.string(),
      title: z.string().nullable(),
    })
    .nullable(),
});

export const TextBlockSchema = z.object({
  type: z.literal("TEXT"),
  children: z.array(TextLeafSchema).min(1),
});

export const ListBlockSchema = z.object({
  type: z.literal("LIST"),
  style: z.enum(["UNORDERED", "ORDERED"]),
  items: z.array(z.array(TextLeafSchema).min(1)),
});

export const HeadingBlockSchema = z.object({
  type: z.literal("HEADING"),
  level: z.enum(["2", "3"]),
  children: z.array(TextLeafSchema).min(1),
});

export const BlockSchema = z.discriminatedUnion("type", [
  TextBlockSchema,
  ListBlockSchema,
  HeadingBlockSchema,
]);
