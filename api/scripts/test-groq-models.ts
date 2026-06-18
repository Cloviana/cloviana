import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const list = await client.models.list();
    console.log("=== Groq Models ===");
    for (const m of list.data) {
      console.log(`- ${m.id} (owned by ${m.owned_by})`);
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

main();
