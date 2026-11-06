import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OPENCODE_VERSION } from "@/integrations/opencode/opencode.constants";

/** The image recipe and what it bakes in; the tag changes whenever either does. */
export function sandboxImage() {
  const context = resolve(process.cwd(), "../templates");
  const dockerfile = resolve(context, "Dockerfile");
  const recipe = readFileSync(dockerfile, "utf8");
  if (!recipe.includes(`opencode-ai@${OPENCODE_VERSION}\n`)) {
    throw new Error(
      `Sandbox Dockerfile must install OpenCode ${OPENCODE_VERSION}`,
    );
  }
  const hash = createHash("sha256")
    .update(recipe)
    .update(
      readFileSync(resolve(context, "marketplace-default/package-lock.json")),
    )
    .digest("hex")
    .slice(0, 12);
  return {
    context,
    dockerfile,
    name: `cloviana-sandbox-${hash}`,
    tag: `cloviana-sandbox:${hash}`,
  };
}
