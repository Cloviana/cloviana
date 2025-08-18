import { Module, Global } from "@nestjs/common";
import { RabbitMqProviders } from "./rabbitmq.provider";
import { KeywordsProducer } from "./producers/keywords.producer";
import { BlogsProducer } from "./producers/blogs.producer";
import { StoresProducer } from "./producers/stores.producer";

@Global()
@Module({
  providers: [...RabbitMqProviders, KeywordsProducer, BlogsProducer, StoresProducer],
  exports: [KeywordsProducer, BlogsProducer, StoresProducer],
})
export class MessagingModule {}
