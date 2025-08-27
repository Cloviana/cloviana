import { z } from "zod";

export const TextNodeSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
  format: z.enum(["bold", "italic", "underline"]).array().nullable(),
});
export type TextNode = z.infer<typeof TextNodeSchema>;

export const ParagraphNodeSchema = z.object({
  type: z.literal("paragraph"),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type ParagraphNode = z.infer<typeof ParagraphNodeSchema>;

export const HeadingNodeSchema = z.object({
  type: z.literal("heading"),
  tag: z.enum(["h2", "h3"]),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type HeadingNode = z.infer<typeof HeadingNodeSchema>;

export const ListNodeSchema = z.object({
  type: z.literal("list"),
  listType: z.enum(["bullet", "number"]),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type ListNode = z.infer<typeof ListNodeSchema>;

export const ListItemNodeSchema = z.object({
  type: z.literal("listitem"),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type ListItemNode = z.infer<typeof ListItemNodeSchema>;

export const QuoteNodeSchema = z.object({
  type: z.literal("quote"),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type QuoteNode = z.infer<typeof QuoteNodeSchema>;

export const ImageNodeSchema = z.object({
  type: z.literal("image"),
  src: z.string(),
  altText: z.string(),
});
export type ImageNode = z.infer<typeof ImageNodeSchema>;

export const LinkNodeSchema = z.object({
  type: z.literal("link"),
  url: z.string(),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type LinkNode = z.infer<typeof LinkNodeSchema>;

export const RootNodeSchema = z.object({
  type: z.literal("root"),
  children: z.array(z.lazy(() => NodeSchema)),
});
export type RootNode = z.infer<typeof RootNodeSchema>;

export const NodeSchema = z.union([
  TextNodeSchema,
  ParagraphNodeSchema,
  HeadingNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  RootNodeSchema,
]);
export type Node = z.infer<typeof NodeSchema>;

export const EditorStateSchema = z.object({
  root: RootNodeSchema,
});
export type EditorState = z.infer<typeof EditorStateSchema>;
