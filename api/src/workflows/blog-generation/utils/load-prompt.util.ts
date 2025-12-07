import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function loadPrompt(filename: string): string {
    return readFileSync(join(__dirname, "..", "prompts", filename), "utf8");
  }