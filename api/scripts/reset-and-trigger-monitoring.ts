import { PrismaClient } from "@prisma/client";
import amqp from "amqplib";

const prisma = new PrismaClient();
const RABBITMQ_URI = process.env.RABBITMQ_URI || "amqp://guest:guest@rabbitmq:5672";
const QUEUE = "monitoring_queue";
const EVENT = "monitoring.run";

async function main() {
  const business = await prisma.business.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!business) {
    console.log("No business found!");
    return;
  }

  const BUSINESS_ID = business.id;
  console.log(`Using Business: ${business.name} (${BUSINESS_ID})`);

  // 1. Find active prompts
  const prompts = await prisma.prompt.findMany({
    where: {
      businessId: BUSINESS_ID,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  const promptIds = prompts.map((p) => p.id);
  console.log(`Found ${promptIds.length} active prompts.`);

  if (promptIds.length === 0) {
    console.log("No active prompts found.");
    return;
  }

  // 2. Mark running jobs as failed
  const updatedJobs = await prisma.job.updateMany({
    where: {
      businessId: BUSINESS_ID,
      type: "MONITORING",
      status: "RUNNING",
    },
    data: {
      status: "FAILED",
      error: "Reset to trigger new run using parallel bypass",
      finishedAt: new Date(),
    },
  });
  console.log(`Reset ${updatedJobs.count} RUNNING jobs to FAILED.`);

  // 3. Create a new Job in database
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

  // 4. Publish to RabbitMQ
  console.log(`Connecting to RabbitMQ at ${RABBITMQ_URI}...`);
  const connection = await amqp.connect(RABBITMQ_URI);
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
  console.log(`Publishing payload to queue "${QUEUE}":`, JSON.stringify(payload, null, 2));

  channel.sendToQueue(QUEUE, messageBuffer, {
    persistent: true,
  });

  console.log("Successfully triggered monitoring!");
  setTimeout(() => connection.close(), 500);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
