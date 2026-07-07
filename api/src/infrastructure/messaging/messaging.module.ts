import { Global, Module } from "@nestjs/common";
import { AuditsProducer } from "./producers/audits.producer";
import { BlogsProducer } from "./producers/blogs.producer";
import { BusinessesProducer } from "./producers/businesses.producer";
import { KnowledgeProducer } from "./producers/knowledge.producer";
import { MonitoringProducer } from "./producers/monitoring.producer";
import { RabbitMqProviders } from "./rabbitmq.provider";

@Global()
@Module({
  providers: [
    ...RabbitMqProviders,
    AuditsProducer,
    BlogsProducer,
    BusinessesProducer,
    KnowledgeProducer,
    MonitoringProducer,
  ],
  exports: [
    AuditsProducer,
    BlogsProducer,
    BusinessesProducer,
    KnowledgeProducer,
    MonitoringProducer,
  ],
})
export class MessagingModule {}
