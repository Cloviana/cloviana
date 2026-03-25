import { Public } from "@/decorators/public.decorator";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common";
import { AuditsService } from "./audits.service";
import { RequestAuditDto } from "./dto/request-audit.dto";
import { VerifyAuditDto } from "./dto/verify-audit.dto";

@Controller("audits")
export class AuditsController {
  constructor(private readonly auditsService: AuditsService) {}

  @Public()
  @Post("request")
  @HttpCode(HttpStatus.CREATED)
  async request(@Body() dto: RequestAuditDto) {
    await this.auditsService.requestAudit(dto.email, dto.domain, dto.country);
    return { message: "Verification email sent" };
  }

  @Public()
  @Post("verify")
  @HttpCode(HttpStatus.CREATED)
  async verify(@Body() dto: VerifyAuditDto) {
    return this.auditsService.verifyAudit(dto.email, dto.code);
  }

  @Public()
  @Get(":id")
  async getAudit(@Param("id") id: string) {
    return this.auditsService.getAudit(id);
  }
}
