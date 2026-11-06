// One-off: gives every marketplace without an active theme its default theme.
// Needs a fresh build (dist/) and the template published (scripts/publish-template.mjs).
// Run: node scripts/backfill-default-themes.mjs   (safe to re-run)
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../dist/app.module.js";
import { ProvisionDefaultThemeUseCase } from "../dist/modules/themes/application/provision-default-theme/provision-default-theme.use-case.js";
import { PrismaService } from "../dist/platform/database/prisma/prisma.service.js";

const app = await NestFactory.createApplicationContext(AppModule, {
  logger: ["error", "warn"],
});

try {
  const prisma = app.get(PrismaService);
  const provisionTheme = app.get(ProvisionDefaultThemeUseCase);

  const marketplaces = await prisma.marketplace.findMany({
    where: { themes: { none: { status: "ACTIVE" } } },
    select: { id: true, slug: true },
  });

  let created = 0;
  for (const { id, slug } of marketplaces) {
    try {
      const result = await provisionTheme.execute({ marketplaceId: id });
      if (result.created) {
        created += 1;
      }
      console.log(
        `${slug}: ${result.created ? "created" : "already had a theme"}`,
      );
    } catch (error) {
      console.error(
        `${slug}: failed (${error instanceof Error ? error.message : error})`,
      );
      process.exitCode = 1;
    }
  }
  console.log(
    `Done: ${created} of ${marketplaces.length} marketplaces got a theme.`,
  );
} finally {
  await app.close();
}
