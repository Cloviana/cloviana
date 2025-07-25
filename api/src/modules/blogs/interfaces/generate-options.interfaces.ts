import { BlogType } from "@prisma/client";
import { Section } from "../schemas/outline.schemas";

export interface GenerateStructureOptions {
  title: string;
  type: BlogType;
  bloggingKeyword: string;
  businessKeyword: string;
  brandVoice?: string;
}

export interface GenerateContentOptions {
  sections: Section[];
  title: string;
  type: BlogType;
  bloggingKeyword: string;
  businessKeyword: string;
  brandVoice?: string;
}
