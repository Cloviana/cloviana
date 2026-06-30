import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { Module } from "@nestjs/common";
import { ChatRateLimiter } from "./chat-rate-limiter.service";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRateLimiter, BusinessAccessGuard],
})
export class ChatModule {}
