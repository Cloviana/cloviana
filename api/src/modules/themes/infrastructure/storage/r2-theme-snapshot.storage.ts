import { DependencyUnavailableError } from "@/shared/errors/application-error";
import { Injectable } from "@nestjs/common";
import { z } from "zod";

import { CloudflareR2Service } from "@/integrations/cloudflare-r2/cloudflare-r2.service";
import type {
  TemplateManifest,
  ThemeSnapshotStorage,
} from "@/modules/themes/application/ports/theme-snapshot.storage.port";

const manifestSchema = z.object({
  version: z.string().min(1),
  commitSha: z.string().regex(/^[0-9a-f]{40}$/),
});

// Written by scripts/publish-template.mjs, which uses the same layout.
const templatePrefix = (templateKey: string, version: string) =>
  `templates/${templateKey}/${version}`;

@Injectable()
export class R2ThemeSnapshotStorage implements ThemeSnapshotStorage {
  constructor(private readonly r2: CloudflareR2Service) {}

  async readTemplateManifest(
    templateKey: string,
    version: string,
  ): Promise<TemplateManifest> {
    try {
      const text = await this.r2.readPrivateText(
        `${templatePrefix(templateKey, version)}/manifest.json`,
      );
      return manifestSchema.parse(JSON.parse(text));
    } catch {
      throw new DependencyUnavailableError(
        "The starter template is not available.",
      );
    }
  }

  async copyTemplate(
    templateKey: string,
    version: string,
    destinationKey: string,
  ): Promise<void> {
    try {
      await this.r2.copyPrivate(
        `${templatePrefix(templateKey, version)}/snapshot.tar.gz`,
        destinationKey,
      );
    } catch {
      throw new DependencyUnavailableError(
        "Could not store the theme. Please try again.",
      );
    }
  }

  remove(key: string): Promise<void> {
    return this.r2.removePrivate(key);
  }
}
