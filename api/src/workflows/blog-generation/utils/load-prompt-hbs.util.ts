import { promises as fs } from "fs";
import path from "path";
import Handlebars from "handlebars";

type LoadPromptOptions = {
  baseDir?: string;
  ext?: string;
  partialsDir?: string;
  helpers?: Record<string, Handlebars.HelperDelegate>;
};

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: string[] = [];

  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      out.push(...(await listFilesRecursive(full)));
    } else {
      out.push(full);
    }
  }

  return out;
}

export async function loadPromptHbs(
  name: string,
  data?: Record<string, any>,
  opts: LoadPromptOptions = {}
): Promise<string> {
  const baseDir = opts.baseDir ?? path.resolve(__dirname, "..", "prompts");
  const ext = opts.ext ?? ".hbs";
  const filePath = path.join(baseDir, `${name}${ext}`);

  if (opts.helpers) {
    for (const [k, v] of Object.entries(opts.helpers)) {
      Handlebars.registerHelper(k, v);
    }
  }

  if (opts.partialsDir) {
    const partialFiles = (await listFilesRecursive(opts.partialsDir)).filter((f) =>
      f.endsWith(ext)
    );

    await Promise.all(
      partialFiles.map(async (absPath) => {
        const rel = path.relative(opts.partialsDir!, absPath);
        const id = rel
          .slice(0, -ext.length)
          .split(path.sep)
          .join("/");
        const src = await fs.readFile(absPath, "utf-8");
        Handlebars.registerPartial(id, src);
      })
    );
  }

  const template = await fs.readFile(filePath, "utf-8");
  const compile = Handlebars.compile(template, { noEscape: true });
  return compile(data ?? {});
}
