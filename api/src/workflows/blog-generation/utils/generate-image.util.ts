import { StorageService } from "@/infrastructure/storage/storage.service";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import pRetry from "p-retry";

type ImageQuality = "low" | "medium" | "high" | "auto";

type GenerateImageArgs = {
  prompt: string;
  referencedImageUrls?: string[];
  quality?: ImageQuality;
  destination: {
    storage: StorageService;
    path: string;
  };
};

const RETRY = { retries: 3, minTimeout: 1000, maxTimeout: 8000, factor: 2 };

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function fetchImage(url: string) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return {
    buffer: Buffer.from(res.data),
    mimeType: res.headers["content-type"] || "image/png",
  };
}

function mapQualityToResolution(quality: ImageQuality = "medium"): string {
  switch (quality) {
    case "low":
      return "1K";
    case "high":
      return "4K";
    case "medium":
    case "auto":
    default:
      return "2K";
  }
}

export async function generateImage({
  prompt,
  referencedImageUrls = [],
  quality,
  destination,
}: GenerateImageArgs): Promise<string> {
  const hasRefs = referencedImageUrls.length > 0;
  const resolution = mapQualityToResolution(quality);

  const result = await pRetry(async () => {
    const contents: any[] = [{ text: prompt }];

    if (hasRefs) {
      const refImages = await Promise.all(referencedImageUrls.map(fetchImage));

      const imageParts = refImages.map(({ buffer, mimeType }) => ({
        inlineData: {
          mimeType: mimeType,
          data: buffer.toString("base64"),
        },
      }));

      contents.push(...imageParts);
    }

    const response = await genai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: contents,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: resolution,
        },
      },
    });

    return response;
  }, RETRY);

  let base64: string | undefined;

  const candidate = result.candidates?.[0];
  if (candidate?.content?.parts) {
    for (const part of candidate.content.parts) {
      if (part.inlineData?.data) {
        base64 = part.inlineData.data;
        break;
      }
    }
  }

  if (!base64) throw new Error("Empty image response from Gemini");

  const data = Buffer.from(base64, "base64");
  const mime = "image/png";
  const ext = "png";

  const finalPath = destination.path.replace(/\.\w+$/, `.${ext}`);

  await pRetry(() => destination.storage.upload(finalPath, data, mime), RETRY);

  const url = destination.storage.getCdnUrl(finalPath);
  return url;
}
