import { z } from "zod";
import {
  TextBlockSchema,
  ListBlockSchema,
  HeadingBlockSchema,
  BlockSchema,
  TextLeafSchema,
} from "../schemas/block.schemas";

export type TextBlock = z.infer<typeof TextBlockSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type Block = z.infer<typeof BlockSchema>;
export type TextLeaf = z.infer<typeof TextLeafSchema>;
