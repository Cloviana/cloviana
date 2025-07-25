import { z } from "zod";
import { OutlineSchema, SectionSchema } from "../schemas/outline.schemas";

export type Outline = z.infer<typeof OutlineSchema>;
export type Section = z.infer<typeof SectionSchema>;
