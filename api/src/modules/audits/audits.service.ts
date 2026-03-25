import { PrismaService } from "@/clients/prisma/prisma.service";
import { ResendService } from "@/clients/resend/resend.service";
import { AuditsProducer } from "@/infrastructure/messaging/producers/audits.producer";
import { CACHE_MANAGER, Cache } from "@nestjs/cache-manager";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomInt } from "crypto";

const VERIFY_PREFIX = "audit-verify";
const VERIFY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const VERIFY_EXPIRY_MINUTES = 10;
const DEV_EMAIL = "samuel@cloviana.com";
const DEV_CODE = 123456;

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "hotmail.co.uk",
  "outlook.com",
  "outlook.co.uk",
  "aol.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "mail.com",
  "protonmail.com",
  "proton.me",
  "zoho.com",
  "yandex.com",
  "gmx.com",
  "gmx.net",
  "live.com",
  "msn.com",
]);

interface VerifyPayload {
  code: number;
  domain: string;
  country: string;
}

@Injectable()
export class AuditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly resend: ResendService,
    private readonly auditsProducer: AuditsProducer,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async requestAudit(email: string, domain: string, country: string = "US") {
    this.validateWorkEmail(email);

    const isDev = email.toLowerCase() === DEV_EMAIL;

    // Dev bypass: skip duplicate check and email sending
    if (isDev) {
      await this.cache.set(
        `${VERIFY_PREFIX}:${email}`,
        JSON.stringify({ code: DEV_CODE, domain, country } satisfies VerifyPayload),
        VERIFY_TTL_MS,
      );
      return;
    }

    const existing = await this.prisma.audit.findFirst({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(
        "An audit has already been requested for this email",
      );
    }

    const code = randomInt(100_000, 999_999);

    await this.cache.set(
      `${VERIFY_PREFIX}:${email}`,
      JSON.stringify({ code, domain, country } satisfies VerifyPayload),
      VERIFY_TTL_MS,
    );

    await this.resend.sendVerificationEmail(email, code, VERIFY_EXPIRY_MINUTES);
  }

  async verifyAudit(email: string, code: number) {
    const raw = await this.cache.get<string>(`${VERIFY_PREFIX}:${email}`);

    if (!raw) {
      throw new BadRequestException(
        "Verification code expired or not found. Please request a new one.",
      );
    }

    const payload: VerifyPayload = JSON.parse(raw);

    if (payload.code !== code) {
      throw new BadRequestException("Invalid verification code");
    }

    await this.cache.del(`${VERIFY_PREFIX}:${email}`);

    const audit = await this.prisma.audit.create({
      data: { email, domain: payload.domain, country: payload.country },
    });

    await this.auditsProducer.run({ auditId: audit.id });

    return { auditId: audit.id };
  }

  async getAudit(auditId: string) {
    const audit = await this.prisma.audit.findUnique({
      where: { id: auditId },
      
    });

    if (!audit) {
      throw new NotFoundException("Audit not found");
    }

    return audit;
  }

  private validateWorkEmail(email: string) {
    const domain = email.split("@")[1]?.toLowerCase();

    if (!domain || FREE_EMAIL_DOMAINS.has(domain)) {
      throw new BadRequestException(
        "Please use a work email address. Free email providers are not accepted.",
      );
    }
  }
}
