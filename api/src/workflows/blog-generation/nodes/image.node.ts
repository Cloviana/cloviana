import { GoogleGenAI } from "@google/genai";
import { StateAnnotation } from "../blog-generation.state";
import axios from "axios";

export async function image(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[image] start");

  if (!state._outline?.thumbnail?.prompt) {
    console.error("[image] missing thumbnail prompt in state._outline");
    throw new Error(
      "No thumbnail prompt available in state._outline.thumbnail.prompt",
    );
  }

  const ai = new GoogleGenAI({});

  const contents: any[] = [{ text: state._outline.thumbnail.prompt }];

  if (state._outline.thumbnail.assets && state._outline.thumbnail.assets.length > 0) {
    console.info(`[image] Adding ${state._outline.thumbnail.assets.length} reference images`);
    
    for (const asset of state._outline.thumbnail.assets) {
      if (asset.imageUrl) {
        try {
          const response = await axios.get(asset.imageUrl, {
            responseType: "arraybuffer",
          });
          const base64Image = Buffer.from(response.data).toString("base64");
          
          const mimeType = asset.imageUrl.match(/\.(png|jpg|jpeg|webp)$/i)?.[1] || "jpeg";
          const fullMimeType = `image/${mimeType === "jpg" ? "jpeg" : mimeType}`;
          
          contents.push({
            inlineData: {
              mimeType: fullMimeType,
              data: base64Image,
            },
          });
        } catch (err: any) {
          console.warn(`[image] Failed to fetch reference image ${asset.imageUrl}:`, err?.message);
        }
      }
    }
  }

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents,
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K",
        },
      },
    });
  } catch (err: any) {
    console.error("[image] API request failed:", err?.message ?? err);
    throw err;
  }

  let imageData: string | undefined;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      imageData = part.inlineData.data;
      break;
    }
  }

  if (!imageData) {
    console.error("[image] API response missing image data:", response);
    throw new Error("Image API did not return valid image data");
  }

  const url = `data:image/png;base64,${imageData}`;

  console.info("[image] success. Generated 2K 16:9 image with reference assets");

  return { _image: { url, alt: state._outline.thumbnail.altText } };
}