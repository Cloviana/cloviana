import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.job.deleteMany({
      where: {
        businessId: "cmqfaiw9k0001ilps5ok459vn",
        type: "PROMPT_RESEARCH",
      },
    });

    console.log(`Successfully deleted ${result.count} prompt research jobs.`);
  } catch (err) {
    console.error("Error deleting jobs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
