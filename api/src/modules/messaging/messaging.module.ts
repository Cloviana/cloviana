import { Module, Global } from "@nestjs/common";
import { RabbitMqProviders } from "./rabbitmq.provider";
import { KeywordsProducer } from "./producers/keywords.producer";
import { BlogsProducer } from "./producers/blogs.producer";

@Global()
@Module({
  providers: [...RabbitMqProviders, KeywordsProducer, BlogsProducer],
  exports: [KeywordsProducer, BlogsProducer],
})
export class MessagingModule {}
