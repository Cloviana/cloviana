const { PrismaClient } = require('@prisma/client');
const amqplib = require('amqplib');

const BUSINESS_ID = 'cmqfaiw9k0001ilps5ok459vn';
const RABBITMQ_URI = process.env.RABBITMQ_URI || 'amqp://localhost:5672';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get active prompts
    const prompts = await prisma.prompt.findMany({
      where: { businessId: BUSINESS_ID, status: 'ACTIVE' },
      select: { id: true },
    });
    
    const promptIds = prompts.map(p => p.id);
    console.log(`Found ${promptIds.length} active prompts`);
    
    // Create a job first
    const job = await prisma.job.create({
      data: {
        type: 'MONITORING',
        status: 'PENDING',
        businessId: BUSINESS_ID,
        payload: { businessId: BUSINESS_ID, promptIds, runDate: new Date().toISOString() },
      },
    });
    console.log(`Created job: ${job.id}`);
    
    // Publish to RabbitMQ
    const conn = await amqplib.connect(RABBITMQ_URI);
    const channel = await conn.createChannel();
    
    const queue = 'monitoring_queue';
    await channel.assertQueue(queue, { durable: true, autoDelete: false });
    
    const payload = {
      jobId: job.id,
      businessId: BUSINESS_ID,
      promptIds,
      runDateIso: new Date().toISOString(),
    };
    
    // NestJS RMQ uses a specific format with pattern and data
    const message = {
      pattern: 'monitoring.run',
      data: payload,
    };
    
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    
    console.log(`Published monitoring.run event for ${BUSINESS_ID}`);
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    await channel.close();
    await conn.close();
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
