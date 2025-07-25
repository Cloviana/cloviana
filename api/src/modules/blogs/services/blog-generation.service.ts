import { Injectable } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { AppConfiguration } from "@/config/app.configuration";
import { StorageService } from "@/modules/storage/storage.service";
import OpenAI from "openai";
import FormData from "form-data";
import { Retryable } from "@/decorators/retryable.decorator";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod.mjs";
import { firstValueFrom } from "rxjs";
import { OutlineSchema } from "../schemas/outline.schemas";
import type { Outline } from "../interfaces/outline.interfaces";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import Handlebars from "handlebars";
import { fileURLToPath } from "url";
import type {
  GenerateContentOptions,
  GenerateStructureOptions,
} from "../interfaces/generate-options.interfaces";
import {
  ListNodePayloadSchema,
  NodePayload,
  ParagraphNodePayloadSchema,
} from "../schemas/node.schemas";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

@Injectable()
export class BlogGenerationService {
  private readonly openai = new OpenAI();
  private static readonly MODEL = "gpt-4o-mini-2024-07-18";
  private static readonly RETRY_CONFIG = {
    retries: 3,
    minTimeout: 2000,
    factor: 2,
  };

  private static readonly NodesResponseSchema = z.object({
    nodes: z
      .array(
        z.discriminatedUnion("type", [
          ParagraphNodePayloadSchema,
          ListNodePayloadSchema,
        ]),
      )
      .min(1),
  });

  private readonly structureTemplate = Handlebars.compile(
    readFileSync(
      join(__dirname, "..", "prompts", "generate-structure.prompt.hbs"),
      "utf-8",
    ),
  );

  private readonly contentTemplate = Handlebars.compile(
    readFileSync(
      join(__dirname, "..", "prompts", "generate-content.prompt.hbs"),
      "utf-8",
    ),
  );

  private readonly ideogramUrl =
    "https://api.ideogram.ai/v1/ideogram-v3/generate";

  constructor(
    private readonly http: HttpService,
    private readonly storage: StorageService,
    private readonly config: AppConfiguration,
  ) {}

  @Retryable(BlogGenerationService.RETRY_CONFIG)
  async generateStructure(payload: GenerateStructureOptions): Promise<Outline> {
    const { output_parsed } = await this.openai.responses.parse({
      model: BlogGenerationService.MODEL,
      input: [{ role: "system", content: this.structureTemplate(payload) }],
      text: { format: zodTextFormat(OutlineSchema, "structure") },
    });
    return output_parsed as Outline;
  }

  @Retryable(BlogGenerationService.RETRY_CONFIG)
  async generateContent({
    sections,
    ...rest
  }: GenerateContentOptions): Promise<NodePayload[]> {
    const nodes: NodePayload[] = [];
    let prevHeading = "";
    let prevText = "";

    for (const sec of sections) {
      if (sec.type !== "INTRODUCTION") {
        nodes.push({
          type: "HEADING",
          level: 2,
          children: [{ type: "TEXT", text: sec.headingText, styles: null }],
        });
        prevHeading = sec.headingText;
      }

      const secNodes = await this.writeContent({
        ...rest,
        ...sec,
        prevHeading,
        prevText,
      });
      nodes.push(...secNodes);
      prevText = this.aggregateText(secNodes);

      for (const sub of sec.subsections ?? []) {
        nodes.push({
          type: "HEADING",
          level: 3,
          children: [{ type: "TEXT", text: sub.headingText, styles: null }],
        });
        prevHeading = sub.headingText;

        const subNodes = await this.writeContent({
          ...rest,
          ...sub,
          prevHeading,
          prevText,
        });
        nodes.push(...subNodes);
        prevText = this.aggregateText(subNodes);
      }
    }

    return nodes;
  }

  private async writeContent(payload: any): Promise<NodePayload[]> {
    const { output_parsed } = await this.openai.responses.parse({
      model: BlogGenerationService.MODEL,
      input: [{ role: "system", content: this.contentTemplate(payload) }],
      text: {
        format: zodTextFormat(
          BlogGenerationService.NodesResponseSchema,
          "nodes",
        ),
      },
    });
    return output_parsed?.nodes ?? [];
  }

  @Retryable(BlogGenerationService.RETRY_CONFIG)
  async generateThumbnail(prompt: string, blogId: string): Promise<string> {
    const form = new FormData();
    form.append(
      "prompt",
      [
        "Images must be photorealistic, meaning taking account of lighting and so on.",
        prompt,
      ].join("\n\n"),
    );
    form.append("rendering_speed", "TURBO");
    form.append("resolution", "1344x768");
    form.append("style_type", "REALISTIC");

    const response = await firstValueFrom(
      this.http.post<{ data: { url: string }[] }>(this.ideogramUrl, form, {
        headers: {
          ...form.getHeaders(),
          "Api-Key": this.config.ideogramApiKey,
        },
      }),
    );

    const imageUrl = response.data.data[0].url;
    const { data } = await firstValueFrom(
      this.http.get<ArrayBuffer>(imageUrl, { responseType: "arraybuffer" }),
    );
    const buffer = Buffer.from(data);

    const path = `thumbnails/${blogId}/thumbnail.png`;
    await this.storage.upload(path, buffer, "image/png");
    return path;
  }

  private aggregateText(nodes: NodePayload[]): string {
    const texts: string[] = [];
    const collect = (items: any[]) =>
      items.forEach((n) => {
        if ("text" in n) texts.push(n.text);
        if (Array.isArray((n as any).children)) collect((n as any).children);
      });

    collect(nodes);
    return texts.join(" ");
  }
}
