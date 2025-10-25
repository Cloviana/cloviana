import { Module } from "@nestjs/common";
import { BetaController } from "./beta.controller";
import { BetaService } from "./beta.service";
import { PrismaService } from "@/clients/prisma/prisma.service";

@Module({
  controllers: [BetaController],
  providers: [BetaService, PrismaService],
})
export class BetaModule {}
