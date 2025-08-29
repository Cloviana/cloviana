import { promises as fs } from "fs";
import path from "path";
import Handlebars from "handlebars";

type LoadPromptOptions = {
  baseDir?: string;
  ext?: string;
  partialsDir?: string;
  helpers?: Record<string, Handlebars.HelperDelegate>;
};

export async function loadPromptHbs(
  name: string,
  data?: Record<string, any>,
  opts: LoadPromptOptions = {},
): Promise<string> {
  const baseDir = opts.baseDir ?? path.resolve(__dirname, "..", "prompts");
  const ext = opts.ext ?? ".hbs";
  const filePath = path.join(baseDir, `${name}${ext}`);

  if (opts.helpers) {
    Object.entries(opts.helpers).forEach(([k, v]) =>
      Handlebars.registerHelper(k, v),
    );
  }

  if (opts.partialsDir) {
    const files = await fs.readdir(opts.partialsDir);
    await Promise.all(
      files
        .filter((f) => f.endsWith(ext))
        .map(async (f) => {
          const id = path.basename(f, ext);
          const src = await fs.readFile(
            path.join(opts.partialsDir!, f),
            "utf-8",
          );
          Handlebars.registerPartial(id, src);
        }),
    );
  }

  const template = await fs.readFile(filePath, "utf-8");
  const compile = Handlebars.compile(template, { noEscape: true });
  return compile(data);
}
