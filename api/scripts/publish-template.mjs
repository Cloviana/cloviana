// Publishes the starter template to the private R2 bucket. Run by hand:
//   node scripts/publish-template.mjs <version>
// Writes templates/marketplace-default/<version>/snapshot.tar.gz (a git repo with one commit) and
// manifest.json ({ version, commitSha }). To ship a new template, publish a new version and bump
// TEMPLATE_VERSION in src/modules/themes/domain/theme-defaults.ts. Existing themes keep their copy.
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const TEMPLATE_KEY = "marketplace-default";
const version = process.argv[2];
if (!version) {
  console.error("Usage: node scripts/publish-template.mjs <version>");
  process.exit(1);
}

const {
  R2_ENDPOINT,
  R2_PRIVATE_BUCKET,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
} = process.env;
if (
  !R2_ENDPOINT ||
  !R2_PRIVATE_BUCKET ||
  !R2_ACCESS_KEY_ID ||
  !R2_SECRET_ACCESS_KEY
) {
  console.error(
    "Set R2_ENDPOINT, R2_PRIVATE_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.",
  );
  process.exit(1);
}

const source = resolve(
  fileURLToPath(import.meta.url),
  "../../../templates",
  TEMPLATE_KEY,
);
const work = mkdtempSync(join(tmpdir(), "cloviana-template-"));
const repo = join(work, "repo");
const archive = join(work, "snapshot.tar.gz");

try {
  cpSync(source, repo, {
    recursive: true,
    filter: (path) => !/(^|\/)(node_modules|\.next)(\/|$)/.test(path),
  });

  // Fixed identity and dates, so the same template content always yields the same commit.
  const identity = {
    GIT_AUTHOR_NAME: "Cloviana",
    GIT_AUTHOR_EMAIL: "templates@cloviana.com",
    GIT_COMMITTER_NAME: "Cloviana",
    GIT_COMMITTER_EMAIL: "templates@cloviana.com",
    GIT_AUTHOR_DATE: "2026-01-01T00:00:00Z",
    GIT_COMMITTER_DATE: "2026-01-01T00:00:00Z",
  };
  const git = (...args) =>
    execFileSync("git", args, {
      cwd: repo,
      env: { ...process.env, ...identity },
      encoding: "utf8",
    }).trim();

  git("init", "-b", "main");
  git("add", "-A");
  git("commit", "-m", "Initial template");
  const commitSha = git("rev-parse", "HEAD");

  // Stops macOS tar from adding ._ metadata files to the snapshot.
  execFileSync("tar", ["-czf", archive, "-C", repo, "."], {
    env: { ...process.env, COPYFILE_DISABLE: "1" },
  });

  const client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
  const prefix = `templates/${TEMPLATE_KEY}/${version}`;
  // Upload the archive before the manifest: the manifest is what makes the version usable.
  await client.send(
    new PutObjectCommand({
      Bucket: R2_PRIVATE_BUCKET,
      Key: `${prefix}/snapshot.tar.gz`,
      Body: readFileSync(archive),
      ContentType: "application/gzip",
    }),
  );
  await client.send(
    new PutObjectCommand({
      Bucket: R2_PRIVATE_BUCKET,
      Key: `${prefix}/manifest.json`,
      Body: JSON.stringify({ version, commitSha }),
      ContentType: "application/json",
    }),
  );
  console.log(`Published ${TEMPLATE_KEY}@${version} (${commitSha})`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
