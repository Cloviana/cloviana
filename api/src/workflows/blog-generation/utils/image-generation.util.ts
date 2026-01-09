import axios from "axios";
import pRetry from "p-retry";
import { GoogleGenAI } from "@google/genai";
import { Context } from "../schemas/context.schema";
import { Outline } from "@/workflows/blog-generation/schemas/outline.schemas";
import { StorageService } from "@/infrastructure/storage/storage.service";

type MaterializeImagesArgs = {
  outline: Outline;
  context: Context;
  model: string;
  storage: StorageService;
  blogId: string;
};

const RETRY = { retries: 3, minTimeout: 1000, maxTimeout: 8000, factor: 2 };

export async function materializeOutlineImages({
  outline,
  context,
  model,
  storage,
  blogId,
}: MaterializeImagesArgs): Promise<Outline> {
  const ai = new GoogleGenAI({});

  const allAssets = [
    ...(context.referenceMaterial?.products ?? []),
    ...(context.referenceMaterial?.collections ?? []),
  ];
  const assetById = new Map(allAssets.map((a) => [a.id, a]));

  const mimeFromUrl = (url: string) => {
    const ext = url.match(/\.(png|jpg|jpeg|webp)$/i)?.[1]?.toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    return "image/jpeg";
  };

  const parseDataUrl = (dataUrl: string) => {
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) throw new Error("Invalid data URL");
    const contentType = m[1];
    const data = Buffer.from(m[2], "base64");
    const ext =
      contentType === "image/webp" ? "webp" : contentType === "image/jpeg" ? "jpg" : "png";
    return { contentType, data, ext };
  };

  const downloadInlinePart = async (url: string) =>
    pRetry(async () => {
      const res = await axios.get(url, { responseType: "arraybuffer" });
      const base64 = Buffer.from(res.data).toString("base64");
      const headerMime =
        typeof res.headers?.["content-type"] === "string" ? res.headers["content-type"] : null;
      const mimeType =
        headerMime && headerMime.startsWith("image/")
          ? headerMime.split(";")[0]
          : mimeFromUrl(url);
      return { inlineData: { mimeType, data: base64 } };
    }, RETRY);

  const job = async (opts: {
    prompt: string;
    referencedAssetIds?: string[];
    imageSize: "1K" | "2K";
    outPath: string;
    setUrl: (url: string) => void;
  }) => {
    const refUrls =
      (opts.referencedAssetIds ?? [])
        .map((id) => assetById.get(id)?.imageUrl)
        .filter(Boolean) as string[];

    const refParts = await Promise.all(refUrls.map((u) => downloadInlinePart(u)));

    const response = await pRetry(
      () =>
        ai.models.generateContent({
          model,
          contents: [{ text: opts.prompt }, ...refParts],
          config: {
            responseModalities: ["IMAGE"],
            imageConfig: { aspectRatio: "16:9", imageSize: opts.imageSize },
          },
        }),
      RETRY
    );

    const parts = response?.candidates?.[0]?.content?.parts ?? [];
    const inline = parts.find((p: any) => p?.inlineData?.data)?.inlineData;
    if (!inline?.data) throw new Error("Gemini image response missing inlineData.data");

    const dataUrl = `data:${inline.mimeType || "image/png"};base64,${inline.data}`;
    const { contentType, data, ext } = parseDataUrl(dataUrl);

    const blobPath = opts.outPath.replace(/\.(png|jpg|jpeg|webp)$/i, `.${ext}`);

    await pRetry(() => storage.upload(blobPath, data, contentType), RETRY);

    opts.setUrl(storage.getCdnUrl(blobPath));
  };

  const sections = (outline.sections ?? []).filter((s) => s.contextualImage);
  //if (sections.length !== 2) {
  //  throw new Error(`Expected exactly 2 section contextual images, got ${sections.length}`);
  //}

  const tasks: Promise<void>[] = sections.map((s) =>
    job({
      prompt: s.contextualImage!.prompt,
      referencedAssetIds: s.contextualImage!.referencedAssetIds ?? [],
      imageSize: "1K",
      outPath: `blogs/${blogId}/sections/${s.sectionId}.png`,
      setUrl: (url) => {
        s.contextualImage!.url = url;
      },
    })
  );

  if (outline.thumbnail?.prompt) {
    tasks.push(
      job({
        prompt: outline.thumbnail.prompt,
        referencedAssetIds: outline.thumbnail.referencedAssetIds ?? [],
        imageSize: "2K",
        outPath: `blogs/${blogId}/thumbnail.png`,
        setUrl: (url) => {
          outline.thumbnail!.url = url;
        },
      })
    );
  }

  await Promise.all(tasks);
  return outline;
}
