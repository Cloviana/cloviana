import { z } from "zod";
import {
  ImageAngleSchema,
  ImageIntentSchema,
  ImageSchema,
} from "../schemas/outline";

export type ImageIntent = z.infer<typeof ImageIntentSchema>;
export type ImageSpec = z.infer<typeof ImageSchema>;

type BuildImagePromptArgs = {
  image: ImageSpec;
};

type IntentBuilder = (args: BuildImagePromptArgs) => string;

function angleToText(angle: z.infer<typeof ImageAngleSchema>): string {
  if (angle === "front") return "front-facing view";
  if (angle === "three_quarter") return "three-quarter angle view";
  if (angle === "side") return "side view";
  if (angle === "top_down") return "top-down view";
  return "macro close-up view";
}

function referencedIdentityText(
  referencedAssetIds: ImageSpec["referencedAssetIds"],
): string {
  if (!referencedAssetIds?.length) return "";
  return [
    "CRITICAL IDENTITY MATCH:",
    "A reference image is provided. The generated product/packaging must match the referenced product EXACTLY.",
    "Match silhouette, proportions, closure/cap form, label placement, typography layout, colors, materials, and any distinctive marks.",
    "Do not simplify, stylize, restyle, or alter the product in any way.",
  ].join(" ");
}

function basePhotoRealText(): string {
  return [
    "Photorealistic high-resolution photography.",
    "Realistic optics, accurate materials, natural lighting and shadows (no illustration, no CGI look).",
    "No text overlays, no badges, no UI, no watermarks.",
  ].join(" ");
}

function sceneAndAngleText(image: ImageSpec): string {
  return [image.sceneDescription.trim(), angleToText(image.angle) + "."].join(
    " ",
  );
}

function forbidText(list: string[]): string {
  return ["FORBIDDEN:", ...list].join(" ");
}

const intentPromptBuilders: Record<ImageIntent, IntentBuilder> = {
  thumbnail: ({ image }) =>
    [
      basePhotoRealText(),
      referencedIdentityText(image.referencedAssetIds),
      "Thumbnail intent: editorial lifestyle mood; do not make the product a hero shot.",
      forbidText([
        "text overlays",
        "badges",
        "UI elements",
        "before/after",
        "clinical/diagnostic visuals",
      ]),
      sceneAndAngleText(image),
    ]
      .filter(Boolean)
      .join(" "),

  problem: ({ image }) =>
    [
      basePhotoRealText(),
      referencedIdentityText(image.referencedAssetIds),
      "Problem intent: editorial pain validation; humans allowed; no product or packaging present; no usage; no solution implied.",
      forbidText([
        "before/after",
        "clinical/diagnostic visuals",
        "text overlays",
        "badges",
        "UI elements",
      ]),
      sceneAndAngleText(image),
    ]
      .filter(Boolean)
      .join(" "),

  product_recommendation: ({ image }) =>
    [
      basePhotoRealText(),
      referencedIdentityText(image.referencedAssetIds),
      "Product recommendation intent: studio product/packaging photograph only.",
      forbidText([
        "people",
        "hands",
        "faces",
        "usage",
        "props",
        "text overlays",
        "badges",
        "UI elements",
        "before/after",
        "clinical/diagnostic visuals",
      ]),
      sceneAndAngleText(image),
    ]
      .filter(Boolean)
      .join(" "),

  comparison_product: ({ image }) =>
    [
      basePhotoRealText(),
      referencedIdentityText(image.referencedAssetIds),
      "Comparison intent: A studio product/packaging photograph only.",
      forbidText([
        "people",
        "hands",
        "faces",
        "usage",
        "props",
        "text overlays",
        "badges",
        "UI elements",
        "before/after",
        "clinical/diagnostic visuals",
      ]),
      sceneAndAngleText(image),
    ]
      .filter(Boolean)
      .join(" "),
};

export function buildImagePrompt(args: BuildImagePromptArgs): string {
  return intentPromptBuilders[args.image.intent](args);
}
