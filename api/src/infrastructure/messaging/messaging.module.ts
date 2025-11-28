import { Global, Module } from "@nestjs/common";
import { BlogsProducer } from "./producers/blogs.producer";
import { KeywordsProducer } from "./producers/keywords.producer";
import { ProductsProducer } from "./producers/products.producer";
import { StoresProducer } from "./producers/stores.producer";
import { RabbitMqProviders } from "./rabbitmq.provider";

@Global()
@Module({
  providers: [
    ...RabbitMqProviders,
    KeywordsProducer,
    BlogsProducer,
    StoresProducer,
    ProductsProducer,
  ],
  exports: [KeywordsProducer, BlogsProducer, StoresProducer, ProductsProducer],
})
export class MessagingModule {}
