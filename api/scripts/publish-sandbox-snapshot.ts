// Builds the sandbox image on Daytona. Run by hand from api/ after changing templates/Dockerfile
// or the template's lockfile, then set DAYTONA_SNAPSHOT to the printed name:
//   node --import tsx scripts/publish-sandbox-snapshot.ts
import "dotenv/config";
import { Daytona, Image } from "@daytona/sdk";
import { sandboxImage } from "../src/integrations/sandbox/sandbox-image";

const { DAYTONA_API_KEY, DAYTONA_API_URL, DAYTONA_TARGET } = process.env;
if (!DAYTONA_API_KEY) {
  console.error("Set DAYTONA_API_KEY.");
  process.exit(1);
}

const image = sandboxImage();
const daytona = new Daytona({
  apiKey: DAYTONA_API_KEY,
  apiUrl: DAYTONA_API_URL,
  target: DAYTONA_TARGET || "eu",
});

const existing = await daytona.snapshot.get(image.name).catch(() => null);
if (existing) {
  console.log(
    `DAYTONA_SNAPSHOT=${image.name} (${existing.state}, already built)`,
  );
  process.exit(0);
}

await daytona.snapshot.create(
  {
    name: image.name,
    image: Image.fromDockerfile(image.dockerfile),
    resources: { cpu: 2, memory: 4, disk: 10 },
  },
  { onLogs: (line) => console.log(line.trimEnd()), timeout: 1800 },
);
console.log(`DAYTONA_SNAPSHOT=${image.name}`);
