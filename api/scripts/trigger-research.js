import amqp from "amqplib";

const RABBITMQ_URI = "amqp://guest:guest@127.0.0.1:5672";
const QUEUE = "businesses_queue";
const EVENT = "business.prompt-generation.run";
const BUSINESS_ID = "cmqfaiw9k0001ilps5ok459vn";

async function main() {
  let connection;
  try {
    console.log(`Connecting to RabbitMQ at ${RABBITMQ_URI}...`);
    connection = await amqp.connect(RABBITMQ_URI);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, {
      durable: true,
      autoDelete: false,
    });

    const payload = {
      pattern: EVENT,
      data: { businessId: BUSINESS_ID },
    };

    const messageBuffer = Buffer.from(JSON.stringify(payload));
    console.log(
      `Publishing payload to queue "${QUEUE}":`,
      JSON.stringify(payload, null, 2),
    );

    channel.sendToQueue(QUEUE, messageBuffer, {
      persistent: true,
    });

    console.log("Successfully published event!");
  } catch (err) {
    console.error("Error publishing event:", err);
  } finally {
    if (connection) {
      setTimeout(() => connection.close(), 500);
    }
  }
}

main();
