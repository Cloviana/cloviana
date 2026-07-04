import { Global, Module } from "@nestjs/common";
import { AuditsProducer } from "./producers/audits.producer";
import { BlogsProducer } from "./producers/blogs.producer";
import { BusinessesProducer } from "./producers/businesses.producer";
import { MonitoringProducer } from "./producers/monitoring.producer";
import { RabbitMqProviders } from "./rabbitmq.provider";

@Global()
@Module({
  providers: [
    ...RabbitMqProviders,
    AuditsProducer,
    BlogsProducer,
    BusinessesProducer,
    MonitoringProducer,
  ],
  exports: [AuditsProducer, BlogsProducer, BusinessesProducer, MonitoringProducer],
})
export class MessagingModule {}
