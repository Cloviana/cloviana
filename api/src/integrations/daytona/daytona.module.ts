import { Module } from "@nestjs/common";
import { DaytonaService } from "./daytona.service";

@Module({ providers: [DaytonaService], exports: [DaytonaService] })
export class DaytonaModule {}
