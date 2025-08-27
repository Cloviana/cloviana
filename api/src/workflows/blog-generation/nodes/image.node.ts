import axios from "axios";
import FormData from "form-data";
import { StateAnnotation } from "../blog-generation.state";

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

  const form = new FormData();
  const prompt = [
    "Images must be photorealistic, with realistic lighting, texture, and tone.",
    state._outline.thumbnail.prompt,
  ].join("\n\n");

  form.append("prompt", prompt);
  form.append("rendering_speed", "QUALITY");
  form.append("resolution", "1344x768");
  form.append("style_type", "REALISTIC");

  console.debug("[image] payload built", {
    promptPreview: prompt.slice(0, 80) + (prompt.length > 80 ? "..." : ""),
    resolution: "1344x768",
    style: "REALISTIC",
    rendering_speed: "QUALITY",
  });

  const t0 = Date.now();
  let data;
  try {
    const res = await axios.post(
      "https://api.ideogram.ai/v1/ideogram-v3/generate",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "Api-Key": process.env.IDEOGRAM_API_KEY!,
        },
      },
    );
    data = res.data;
    console.info("[image] API call completed in", Date.now() - t0, "ms");
  } catch (err: any) {
    console.error("[image] API request failed:", err?.message ?? err);
    throw err;
  }

  const url = (data as { data: { url: string }[] })?.data?.[0]?.url;
  if (!url) {
    console.error("[image] API response missing url field:", data);
    throw new Error("Image API did not return a valid URL");
  }

  console.info("[image] success. URL:", url);

  return { _image: { url, alt: state._outline.thumbnail.altText } };
}
