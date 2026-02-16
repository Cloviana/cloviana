import { CurrentUser } from "@/decorators/current-user.decorator";
import { Public } from "@/decorators/public.decorator";
import type { AuthUser } from "@/interfaces/auth-user.interface";
import { TicketExchangeDto } from "@/modules/auth/dtos/ticket-exchange.dto";
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { ShopifyCallbackDto } from "./dtos/shopify-callback.dto";
import { ShopifyInstallDto } from "./dtos/shopify-install.dto";
import { ShopifyOnboardDto } from "./dtos/shopify-onboard.dto";
import { ShopifyStartDto } from "./dtos/shopify-start.dto";

@Controller("auth")
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get("shopify/start")
  async startFromPublic(
    @Query() dto: ShopifyInstallDto,
    @CurrentUser() user: AuthUser,
    @Res() res: FastifyReply,
  ) {
    const ok = await this.auth.verifyOwnership(user.sub, dto.storeId as string);
    if (!ok)
      throw new HttpException(
        "You do not own this store",
        HttpStatus.FORBIDDEN,
      );
    const state = await this.auth.createCachedState({
      uid: user.sub,
      storeId: dto.storeId,
      shop: dto.shop,
      src: "app",
    });
    const url = await this.auth.buildShopifyAuthUrl(dto.shop, state);
    return res.send({ url });
  }

  @Get("shopify/onboard")
  async startFromOnboarding(
    @Query() dto: ShopifyOnboardDto,
    @CurrentUser() user: AuthUser,
    @Res() res: FastifyReply,
  ) {
    const state = await this.auth.createCachedState({
      uid: user.sub,
      storeId: null,
      shop: dto.shop,
      src: "onboarding",
    });
    const url = await this.auth.buildShopifyAuthUrl(dto.shop, state);
    return res.send({ url });
  }

  @Public()
  @Get("shopify")
  async startShopifyOAuth(
    @Query() dto: ShopifyStartDto,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    if (dto.hmac) this.auth.verifyShopifyHmac(req.raw.url || "", dto.hmac);
    const url = await this.auth.buildShopifyAuthUrl(dto.shop);
    return res.status(302).redirect(url);
  }

  @Public()
  @Get("shopify/callback")
  async shopifyCallback(
    @Query() dto: ShopifyCallbackDto,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    try {
      this.auth.verifyShopifyHmac(req.raw.url || "", dto.hmac);
    } catch {
      throw new HttpException("Invalid HMAC", HttpStatus.BAD_REQUEST);
    }
    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Connecting…</title>
<style>
  html,body{height:100%;margin:0;padding:0;background:#fff;}
  body{display:flex;align-items:center;justify-content:center;}
  .spinner{
    width:24px;
    height:24px;
    border-radius:50%;
    border:3px solid rgba(0,0,0,0.15);
    border-top-color:rgba(0,0,0,0.7);
    animation:spin .8s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
  <div class="spinner"></div>
<script>
(async () => {
  const params = new URLSearchParams(location.search);
  const payload = {};
  for (const [k,v] of params) payload[k] = v;
  try {
    const r = await fetch('/api/auth/shopify/callback/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    if (!r.ok) throw new Error();
    const data = await r.json();
    if (!data.redirectUrl) throw new Error();
    location.replace(data.redirectUrl);
  } catch {
    location.replace('/login?e=shopify_callback_failed');
  }
})();
</script>
</body>
</html>`;

    res.type("text/html").send(html);
  }

  @Public()
  @Post("shopify/callback/complete")
  async shopifyCallbackComplete(
    @Body() dto: ShopifyCallbackDto,
    @Req() req: FastifyRequest,
  ) {
    this.auth.verifyShopifyHmac(
      `?${new URLSearchParams(dto as any).toString()}`,
      dto.hmac,
    );
    const redirectUrl = await this.auth.handleShopifyCallback(dto);
    return { redirectUrl };
  }

  // NEW: exchange one-time ticket for Supabase session (used by Next.js server route)
  @Public()
  @Post("shopify/session")
  async exchangeTicket(@Body() body: TicketExchangeDto) {
    const data = await this.auth.consumeLoginTicket(body.ticket);
    if (!data)
      throw new HttpException(
        "Invalid or expired ticket",
        HttpStatus.BAD_REQUEST,
      );
    // Return raw tokens; frontend (same-origin app) will set HttpOnly cookies
    return data;
  }
}
