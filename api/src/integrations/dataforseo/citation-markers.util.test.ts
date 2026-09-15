import assert from "node:assert/strict";
import test from "node:test";
import {
  appendCitationMarkers,
  rewriteInlineCitations,
} from "./citation-markers.util";

const source = (url: string, title = "") => ({ url, title, excerpt: null });

test("keeps Google's own nested [[n]] marker intact", () => {
  const markdown =
    "Vertebrates fall into five groups. [[1]](https://bbc.co.uk/a)[[2]](https://bbc.co.uk/b)";

  const { content, citations } = rewriteInlineCitations(markdown);

  assert.deepEqual(
    citations.map(({ url }) => url),
    ["https://bbc.co.uk/a", "https://bbc.co.uk/b"],
  );
  assert.ok(content.includes("[[1]](https://bbc.co.uk/a)"));
});

test("leaves images alone — they share the link syntax", () => {
  const markdown =
    "![A chart](https://api.dataforseo.com/cdn/i/1127:0)\n\nText.";

  const { content, citations } = rewriteInlineCitations(markdown);

  assert.equal(citations.length, 0);
  assert.ok(
    content.includes("![A chart](https://api.dataforseo.com/cdn/i/1127:0)"),
  );
});

test("drops the search engine's own navigation link", () => {
  const markdown =
    "[View all](https://www.google.com/search?q=vertebrates) Text.";

  const { content, citations } = rewriteInlineCitations(markdown);

  assert.equal(citations.length, 0);
  assert.ok(!content.includes("google.com/search"));
});

test("rewrites ChatGPT's ([domain](url)) so the domain leaves the prose", () => {
  // `extractMentions` reduces a link to its text, so domain link text would
  // leave "ramp.com" in the visible prose and read as a mention of Ramp.
  const markdown =
    "Ramp handles expenses. ([ramp.com](https://ramp.com/pricing))";

  const { content, citations } = rewriteInlineCitations(markdown);

  assert.equal(
    content,
    "Ramp handles expenses. [[1]](https://ramp.com/pricing)",
  );
  assert.equal(citations.length, 1);
  assert.ok(!content.includes("ramp.com]"));
});

test("gives a URL cited twice the same number, and lists it once", () => {
  const markdown = "a ([x.com](https://x.com/a)) b ([x.com](https://x.com/a))";

  const { content, citations } = rewriteInlineCitations(markdown);

  assert.equal(citations.length, 1);
  assert.equal(content, "a [[1]](https://x.com/a) b [[1]](https://x.com/a)");
});

test("carries titles across from the engine's own source list", () => {
  const { citations } = rewriteInlineCitations(
    "Text. [[1]](https://a.com)",
    new Map([["https://a.com", "A Title"]]),
  );

  assert.equal(citations[0]?.title, "A Title");
});

test("appends markers for engines that place none in the prose", () => {
  assert.equal(
    appendCitationMarkers("Supabase is easy to configure.", [
      source("https://supabase.com/docs"),
    ]),
    "Supabase is easy to configure. [[1]](https://supabase.com/docs)",
  );
  assert.equal(appendCitationMarkers("No sources.", []), "No sources.");
});

test("renumbers per-section markers across the whole answer", () => {
  const answer = [
    appendCitationMarkers("First.", [source("https://a.com")]),
    appendCitationMarkers("Second.", [
      source("https://b.com"),
      source("https://c.com"),
    ]),
  ].join("\n\n");

  const { content, citations } = rewriteInlineCitations(answer);

  assert.deepEqual(
    citations.map(({ url }) => url),
    ["https://a.com", "https://b.com", "https://c.com"],
  );
  assert.ok(content.includes("[[3]](https://c.com)"));
});
