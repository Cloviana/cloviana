import assert from "node:assert/strict";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { pack } from "tar-stream";
import { MAX_SOURCE_FILE_BYTES } from "../src/modules/themes/domain/workspace.policy";
import { unpackSnapshot } from "../src/modules/themes/infrastructure/source/unpack-snapshot";

type Entry = Parameters<ReturnType<typeof pack>["entry"]>[0] & {
  body?: Buffer;
};

async function archive(entries: Entry[]) {
  const tar = pack();
  for (const { body, ...header } of entries) {
    tar.entry(header, body ?? "");
  }
  tar.finalize();
  const chunks: Buffer[] = [];
  for await (const chunk of tar) {
    chunks.push(chunk as Buffer);
  }
  return gzipSync(Buffer.concat(chunks));
}

test("keeps source files and hashes their content", async () => {
  const files = await unpackSnapshot(
    await archive([{ name: "./app/page.tsx", body: Buffer.from("hi") }]),
  );
  assert.equal(files.length, 1);
  assert.equal(files[0].path, "app/page.tsx");
  assert.equal(files[0].size, 2);
  assert.match(files[0].sha256 ?? "", /^[a-f0-9]{64}$/);
});

test("drops unsafe paths, links, secrets and metadata", async () => {
  const files = await unpackSnapshot(
    await archive([
      { name: "../escape.txt", body: Buffer.from("x") },
      { name: "/etc/passwd", body: Buffer.from("x") },
      { name: ".git/config", body: Buffer.from("x") },
      { name: ".env.local", body: Buffer.from("x") },
      { name: "._page.tsx", body: Buffer.from("x") },
      { name: "node_modules/a/index.js", body: Buffer.from("x") },
      { name: "link", type: "symlink", linkname: "/etc/passwd" },
      { name: "ok.ts", body: Buffer.from("x") },
    ]),
  );
  assert.deepEqual(
    files.map((file) => file.path),
    ["ok.ts"],
  );
});

test("lists binary and oversized files without content", async () => {
  const files = await unpackSnapshot(
    await archive([
      { name: "logo.png", body: Buffer.from([1, 0, 2]) },
      { name: "big.txt", body: Buffer.alloc(MAX_SOURCE_FILE_BYTES + 1, 97) },
    ]),
  );
  assert.deepEqual(
    files.map(({ path, sha256, content }) => [path, sha256, content]),
    [
      ["big.txt", null, null],
      ["logo.png", null, null],
    ],
  );
});

test("rejects corrupt archives", async () => {
  await assert.rejects(unpackSnapshot(Buffer.from("not gzip")));
});
