import { z } from "zod";

const InlineStylesSchema = z.object({
  bold: z.boolean(),
  italic: z.boolean(),
  underline: z.boolean(),
});

export const TextNodePayloadSchema = z.object({
  type: z.literal("TEXT"),
  text: z.string(),
  styles: InlineStylesSchema.nullable(),
});

export const ParagraphNodePayloadSchema = z.object({
  type: z.literal("PARAGRAPH"),
  indent: z.number().int().min(0).nullable(),
  children: z.array(TextNodePayloadSchema),
});

export const HeadingNodePayloadSchema = z.object({
  type: z.literal("HEADING"),
  level: z.union([z.literal(2), z.literal(3)]),
  children: z.array(TextNodePayloadSchema),
});

export const ListItemNodePayloadSchema = z.object({
  type: z.literal("LIST_ITEM"),
  children: z.array(TextNodePayloadSchema),
});

export const ListNodePayloadSchema = z.object({
  type: z.literal("LIST"),
  style: z.enum(["unordered", "ordered"]),
  children: z.array(ListItemNodePayloadSchema),
});

export const NodePayloadSchema = 
        z.discriminatedUnion("type", [
          ParagraphNodePayloadSchema,
          HeadingNodePayloadSchema,
          ListNodePayloadSchema,
          ListItemNodePayloadSchema,
          TextNodePayloadSchema
        ])
      

export const RootSchema = z
  .object({
    nodes: z
      .array(
        z.discriminatedUnion("type", [
          ParagraphNodePayloadSchema,
          HeadingNodePayloadSchema,
          ListNodePayloadSchema,
        ])
      )
      .min(1),
  })
  .describe("A list of content blocks for one section");

export type InlineStyles = z.infer<typeof InlineStylesSchema>;
export type TextNodePayload = z.infer<typeof TextNodePayloadSchema>;
export type ParagraphNodePayload = z.infer<typeof ParagraphNodePayloadSchema>;
export type HeadingNodePayload = z.infer<typeof HeadingNodePayloadSchema>;
export type ListItemNodePayload = z.infer<typeof ListItemNodePayloadSchema>;
export type ListNodePayload = z.infer<typeof ListNodePayloadSchema>;
export type Root = z.infer<typeof RootSchema>;
export type NodePayload = z.infer<typeof NodePayloadSchema>;
