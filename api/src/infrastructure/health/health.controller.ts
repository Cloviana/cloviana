import { Public } from "@/common/decorators/public.decorator";
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Get()
  @Public()
  getCurrentHealth() {
    return { status: "ok" };
  }
}
