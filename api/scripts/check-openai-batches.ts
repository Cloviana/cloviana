import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function main() {
  const list = await openai.batches.list();
  console.log("=== OpenAI Batches ===");
  for (const b of list.data) {
    console.log(`- ID: ${b.id}`);
    console.log(`  Status: ${b.status}`);
    console.log(`  File: ${b.input_file_id}`);
    console.log(`  OutputFile: ${b.output_file_id}`);
    console.log(`  ErrorFile: ${b.error_file_id}`);
    console.log(`  CreatedAt: ${new Date(b.created_at * 1000).toISOString()}`);
    if (b.completed_at) {
      console.log(`  CompletedAt: ${new Date(b.completed_at * 1000).toISOString()}`);
    }
    console.log(`  RequestCounts: ${JSON.stringify(b.request_counts)}`);
  }
}

main().catch(console.error);
