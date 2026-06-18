import "dotenv/config";
import { GroqService } from "@/clients/groq/groq.service";
import { AppConfiguration } from "@/config/app.configuration";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function getConfig(): AppConfiguration {
  return Object.assign(new AppConfiguration(), {
    groqApiKey: requireEnv("GROQ_API_KEY"),
  });
}

async function main() {
  const config = getConfig();
  const groq = new GroqService(config);

  console.log("Starting batch of 5 test requests...");
  const requests = Array.from({ length: 5 }).map((_, i) => ({
    custom_id: `req-${i}`,
    body: {
      model: "openai/gpt-oss-120b" as const,
      temperature: 0,
      messages: [
        { role: "system" as const, content: "You are a helper. Respond with standard JSON." },
        { role: "user" as const, content: `Give me a JSON array containing the number ${i + 10}.` }
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "test-schema",
          strict: true,
          schema: {
            type: "object",
            properties: {
              num: { type: "number" }
            },
            required: ["num"],
            additionalProperties: false
          }
        }
      }
    }
  }));

  const start = Date.now();
  const results = await groq.batch(requests);
  console.log(`Completed batch in ${Date.now() - start}ms.`);

  for (const r of results) {
    console.log(`- CustomID: ${r.custom_id}`);
    console.log(`  Content: ${r.content}`);
    console.log(`  Error: ${r.error}`);
  }
}

main().catch(console.error);
