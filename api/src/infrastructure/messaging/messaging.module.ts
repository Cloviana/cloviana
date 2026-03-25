import { Global, Module } from "@nestjs/common";
import { AuditsProducer } from "./producers/audits.producer";
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
    AuditsProducer,
  ],
  exports: [KeywordsProducer, BlogsProducer, StoresProducer, ProductsProducer, AuditsProducer],
})
export class MessagingModule {}
