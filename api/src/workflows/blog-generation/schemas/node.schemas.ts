import { z } from "zod";

type TextFormat = "bold" | "italic" | "underline";

export type TextNode = {
  type: "TEXT";
  text: string;
  format: TextFormat[] | null;
};
export type ParagraphNode = { type: "PARAGRAPH"; children: Node[] };
export type HeadingNode = {
  type: "HEADING";
  tag: "h2" | "h3";
  children: Node[];
};
export type ListItemNode = {
  type: "LIST_ITEM";
  children: (ParagraphNode | ListNode)[];
};
export type ListNode = {
  type: "LIST";
  listType: "bullet" | "number";
  children: ListItemNode[];
};
export type QuoteNode = { type: "QUOTE"; children: Node[] };
export type ImageNode = { type: "IMAGE"; src: string; altText: string };
export type LinkNode = { type: "LINK"; url: string; children: TextNode[] };
export type LineBreakNode = { type: "LINEBREAK" };
export type RootNode = { type: "ROOT"; children: Node[] };

export type Node =
  | TextNode
  | ParagraphNode
  | HeadingNode
  | ListNode
  | ListItemNode
  | QuoteNode
  | ImageNode
  | LinkNode
  | LineBreakNode
  | RootNode;

export const TextNodeSchema = z.object({
  type: z.literal("TEXT"),
  text: z.string(),
  format: z.enum(["bold", "italic", "underline"]).array().nullable(),
});

export const ParagraphNodeSchema = z.object({
  type: z.literal("PARAGRAPH"),
  children: z.array(z.lazy(() => NodeSchema)),
});

export const HeadingNodeSchema = z.object({
  type: z.literal("HEADING"),
  tag: z.enum(["h2", "h3"]),
  children: z.array(z.lazy(() => NodeSchema)),
});

export const ListItemNodeSchema = z.object({
  type: z.literal("LIST_ITEM"),
  children: z.array(z.lazy(() => TextNodeSchema)),
});

export const ListNodeSchema = z.object({
  type: z.literal("LIST"),
  listType: z.enum(["bullet", "number"]),
  children: z.array(z.lazy(() => ListItemNodeSchema)).min(1),
});

export const QuoteNodeSchema = z.object({
  type: z.literal("QUOTE"),
  children: z.array(z.lazy(() => NodeSchema)),
});

export const ImageNodeSchema = z.object({
  type: z.literal("IMAGE"),
  src: z.string(),
  altText: z.string(),
});

export const LinkNodeSchema = z.object({
  type: z.literal("LINK"),
  url: z.string(),
  children: z.array(z.lazy(() => TextNodeSchema)).min(1),
});

export const LineBreakNodeSchema = z.object({
  type: z.literal("LINEBREAK"),
});

export const RootNodeSchema = z.object({
  type: z.literal("ROOT"),
  children: z.array(z.lazy(() => NodeSchema)),
});

export const NodeSchema = z.discriminatedUnion("type", [
  TextNodeSchema,
  ParagraphNodeSchema,
  HeadingNodeSchema,
  ListNodeSchema,
  ListItemNodeSchema,
  RootNodeSchema,
  ImageNodeSchema,
  LinkNodeSchema,
  QuoteNodeSchema,
  LineBreakNodeSchema,
]);

export type InferNode = z.infer<typeof NodeSchema>;

export const EditorStateSchema = z.object({
  root: RootNodeSchema,
});
