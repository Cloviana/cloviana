import { Module, Global } from "@nestjs/common";
import { RabbitMqProviders } from "./rabbitmq.provider";
import { KeywordsProducer } from "./producers/keywords.producer";
import { BlogsProducer } from "./producers/blogs.producer";
import { StoresProducer } from "./producers/stores.producer";
import { ProductsProducer } from "./producers/products.producer";

@Global()
@Module({
  providers: [
    ...RabbitMqProviders,
    KeywordsProducer,
    BlogsProducer,
    StoresProducer,
    ProductsProducer
  ],
  exports: [KeywordsProducer, BlogsProducer, StoresProducer, ProductsProducer],
})
export class MessagingModule {}
