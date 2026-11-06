import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrate uses the direct connection; generation can run without secrets.
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
