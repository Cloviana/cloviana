import { PrismaClient } from "@prisma/client";
import amqp from "amqplib";

const prisma = new PrismaClient();
const RABBITMQ_URI = "amqp://guest:guest@127.0.0.1:5672";
const QUEUE = "monitoring_queue";
const EVENT = "monitoring.run";
const BUSINESS_ID = "cmqfaiw9k0001ilps5ok459vn";

async function main() {
  let connection;
  try {
    // 1. Find all active prompts for cloviana
    const prompts = await prisma.prompt.findMany({
      where: {
        businessId: BUSINESS_ID,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const promptIds = prompts.map((p) => p.id);
    console.log(
      `Found ${promptIds.length} active prompts for business ${BUSINESS_ID}.`,
    );

    if (promptIds.length === 0) {
      console.log("No active prompts found. Cannot trigger monitoring.");
      return;
    }

    // 2. Clean up any existing MONITORING jobs to avoid conflict
    const deletedJobs = await prisma.job.deleteMany({
      where: {
        businessId: BUSINESS_ID,
        type: "MONITORING",
      },
    });
    console.log(`Deleted ${deletedJobs.count} old monitoring jobs.`);

    // 3. Delete old metrics to ensure fresh data
    const deletedMetrics = await prisma.businessMetric.deleteMany({
      where: { businessId: BUSINESS_ID },
    });
    console.log(`Deleted ${deletedMetrics.count} old business metrics.`);

    // 4. Create a new Job in database
    const job = await prisma.job.create({
      data: {
        type: "MONITORING",
        status: "PENDING",
        businessId: BUSINESS_ID,
        payload: {
          businessId: BUSINESS_ID,
          promptIds,
          runDate: new Date().toISOString(),
        },
      },
    });
    console.log(`Created new MONITORING job: ${job.id}`);

    // 5. Publish to RabbitMQ
    console.log(`Connecting to RabbitMQ at ${RABBITMQ_URI}...`);
    connection = await amqp.connect(RABBITMQ_URI);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, {
      durable: true,
      autoDelete: false,
    });

    const payload = {
      pattern: EVENT,
      data: {
        jobId: job.id,
        businessId: BUSINESS_ID,
        promptIds,
        runDateIso: new Date().toISOString(),
      },
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
    console.error("Error executing trigger:", err);
  } finally {
    await prisma.$disconnect();
    if (connection) {
      setTimeout(() => connection.close(), 500);
    }
  }
}

main();
