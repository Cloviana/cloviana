import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  console.log("Sending chat request to openai/gpt-oss-120b...");
  const start = Date.now();
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "user", content: "Say hello!" }
      ]
    });
    console.log(`Success in ${Date.now() - start}ms!`);
    console.log("Response:", JSON.stringify(response.choices[0]?.message));
  } catch (err) {
    console.error(`Failed in ${Date.now() - start}ms! Error:`, err);
  }
}

main();
