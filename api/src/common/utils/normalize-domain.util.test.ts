import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeDomain, normalizeHostname } from "./normalize-domain.util";

describe("normalize-domain util", () => {
  it("extracts the registrable domain", () => {
    assert.equal(
      normalizeDomain("https://analytics.google.com/path"),
      "google.com",
    );
  });

  it("preserves subdomains when normalizing hostnames", () => {
    assert.equal(
      normalizeHostname("https://analytics.google.com/path"),
      "analytics.google.com",
    );
  });
});
