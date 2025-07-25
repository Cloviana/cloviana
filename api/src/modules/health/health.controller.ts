import {
  Controller,
  Get,
} from "@nestjs/common";

@Controller("stores")
export class HealthController {
  @Get()
  async getCurrentHealth() {
    return null
  }
}
