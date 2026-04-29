import { Global, Module } from "@nestjs/common";
import { AuditsProducer } from "./producers/audits.producer";
import { BusinessesProducer } from "./producers/businesses.producer";
import { MonitoringProducer } from "./producers/monitoring.producer";
import { RabbitMqProviders } from "./rabbitmq.provider";

@Global()
@Module({
  providers: [
    ...RabbitMqProviders,
    AuditsProducer,
    BusinessesProducer,
    MonitoringProducer,
  ],
  exports: [AuditsProducer, BusinessesProducer, MonitoringProducer],
})
export class MessagingModule {}
