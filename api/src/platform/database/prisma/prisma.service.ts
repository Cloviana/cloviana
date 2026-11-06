import "dotenv/config";
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const ExtendedPrismaClient = class {
  constructor() {
    // biome-ignore lint/correctness/noConstructorReturn: Workaround for https://github.com/prisma/prisma/issues/18628
    return prisma;
  }
} as new () => typeof prisma;

@Injectable()
export class PrismaService
  extends ExtendedPrismaClient
  implements OnModuleInit
{
  protected readonly logger = new Logger(PrismaService.name, {
    timestamp: true,
  });

  async onModuleInit() {
    await prisma.$connect();
    this.logger.log("Connected to database");
  }
}
