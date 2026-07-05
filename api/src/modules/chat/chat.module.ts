import { BusinessAccessGuard } from "@/common/guards/business-access.guard";
import { BlogsModule } from "@/modules/blogs/blogs.module";
import { Module } from "@nestjs/common";
import { ChatRateLimiter } from "./chat-rate-limiter.service";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
  imports: [BlogsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRateLimiter, BusinessAccessGuard],
})
export class ChatModule {}
