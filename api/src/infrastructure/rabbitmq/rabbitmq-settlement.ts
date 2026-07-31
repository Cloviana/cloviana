import type { LoggerService } from "@nestjs/common";
import type { RmqContext } from "@nestjs/microservices";

export function acknowledgeRabbitMqMessage(
  context: RmqContext | undefined,
  logger: LoggerService,
) {
  settleRabbitMqMessage(context, logger, false);
}

export function requeueRabbitMqMessage(
  context: RmqContext | undefined,
  logger: LoggerService,
) {
  settleRabbitMqMessage(context, logger, true);
}

function settleRabbitMqMessage(
  context: RmqContext | undefined,
  logger: LoggerService,
  requeue: boolean,
) {
  if (!context) {
    return;
  }

  try {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    if (requeue) {
      channel.nack(message, false, true);
    } else {
      channel.ack(message);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Failed to settle RabbitMQ message: ${message}`);
  }
}
