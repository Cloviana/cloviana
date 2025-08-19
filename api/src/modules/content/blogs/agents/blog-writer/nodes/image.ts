import axios from "axios";
import FormData from "form-data";
import { Thumbnail } from "../schemas/outline";
import { Payload } from "../state-annotation";

export async function imageNode(state: {
  _thumbnail: Thumbnail;
  _payload: Payload;
}) {
  const form = new FormData();
  form.append(
    "prompt",
    [
      "Images must be photorealistic, with realistic lighting, texture, and tone.",
      state._thumbnail.prompt,
    ].join("\n\n"),
  );
  form.append("rendering_speed", "QUALITY");
  form.append("resolution", "1344x768");
  form.append("style_type", "REALISTIC");

  const { data } = await axios.post(
    "https://api.ideogram.ai/v1/ideogram-v3/generate",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "Api-Key": process.env.IDEOGRAM_API_KEY!,
      },
    },
  );

  const url = (data as { data: { url: string }[] }).data[0].url;
  return { _image: url };
}
