import { describe, it, expect, vi } from "vitest";
import { aggregateData, RawRecord, TrustScoreCalculator } from "../aggregateData";
import { calculateTrustScore } from "../calculateTrustScore";

// Deterministic stand-in for calculateTrustScore: returns the total tracker count.
// Lets us assert on aggregateData's own grouping/dedup/counting logic without
// coupling every assertion to the trust-score formula's floating point output.
const sumTrustScore: TrustScoreCalculator = (
  cookies,
  localStorage,
  indexedDB,
  cache,
  workers,
  forms
) => cookies + localStorage + indexedDB + cache + workers + forms;

describe("aggregateData", () => {
  it("returns an empty array for empty input", () => {
    expect(aggregateData([], sumTrustScore)).toEqual([]);
  });

  it("aggregates a single record into one TableRecord", () => {
    const record: RawRecord = {
      id: "rec1",
      root_url: "https://example.com",
      created_at: "2024-01-01T00:00:00.000Z",
      cookies: [{ name: "session", domain: "example.com" }],
      local_storage: { theme: "dark" },
      indexeddb: [{ name: "db1", version: "1" }],
      service_workers: ["sw1.js"],
      form_data: ["email"],
      cache_storage: ["cache1"],
    };

    const result = aggregateData([record], sumTrustScore);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "rec1",
      root_url: "https://example.com",
      trackers: 3, // 1 cookie + 1 local storage key + 1 indexeddb db
      stored_data_types: 2, // 1 cache entry + 1 form field
      workers: 1,
      cookie_count: 1,
      local_storage_count: 1,
      indexeddb_count: 1,
      cache_storage_count: 1,
      service_worker_count: 1,
      form_data_count: 1,
      trust_score: 6, // sumTrustScore(1,1,1,1,1,1)
      created_at: "2024-01-01T00:00:00.000Z",
      ids: ["rec1"],
    });
  });

  it("handles a record with no optional fields present", () => {
    const record: RawRecord = {
      id: "min1",
      root_url: "https://minimal.com",
      created_at: "2024-03-01T00:00:00.000Z",
    };

    const result = aggregateData([record], sumTrustScore);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      trackers: 0,
      stored_data_types: 0,
      workers: 0,
      cookie_count: 0,
      local_storage_count: 0,
      indexeddb_count: 0,
      cache_storage_count: 0,
      service_worker_count: 0,
      form_data_count: 0,
      trust_score: 0,
      ids: ["min1"],
    });
  });

  it("dedupes cookies, local storage, indexeddb and service workers across records for the same origin", () => {
    const record1: RawRecord = {
      id: "rec1",
      root_url: "https://example.com",
      created_at: "2024-01-01T00:00:00.000Z",
      cookies: [{ name: "session", domain: "example.com" }],
      local_storage: { theme: "dark" },
      indexeddb: [{ name: "db1", version: "1" }],
      service_workers: ["sw1.js"],
      form_data: ["email"],
      cache_storage: ["cache1"],
    };

    const record2: RawRecord = {
      id: "rec2",
      root_url: "https://example.com",
      created_at: "2024-01-02T00:00:00.000Z",
      cookies: [
        { name: "session", domain: "example.com" }, // duplicate of record1
        { name: "id", domain: "example.com" }, // new
      ],
      local_storage: { theme: "dark", lang: "en" }, // one duplicate, one new
      indexeddb: [{ name: "db1", version: "1" }], // duplicate
      service_workers: ["sw1.js", "sw2.js"], // one duplicate, one new
      form_data: ["password"],
      cache_storage: ["cache2"],
    };

    const result = aggregateData([record1, record2], sumTrustScore);

    expect(result).toHaveLength(1);
    const row = result[0];

    expect(row.cookie_count).toBe(2); // session + id, deduped via Set
    expect(row.local_storage_count).toBe(2); // theme + lang, deduped via Set
    expect(row.indexeddb_count).toBe(1); // db1:1 deduped via Set
    expect(row.service_worker_count).toBe(2); // sw1 + sw2, deduped via Set
    expect(row.cache_storage_count).toBe(2); // not deduped, simple concat
    expect(row.form_data_count).toBe(2); // not deduped, simple concat
    expect(row.ids).toEqual(["rec1", "rec2"]);
    // latest created_at across the group is retained
    expect(row.created_at).toBe("2024-01-02T00:00:00.000Z");
  });

  it("groups records by origin, returning one entry per distinct root_url", () => {
    const recordA: RawRecord = {
      id: "a1",
      root_url: "https://a.com",
      created_at: "2024-01-01T00:00:00.000Z",
      cookies: [{ name: "session", domain: "a.com" }],
    };
    const recordB: RawRecord = {
      id: "b1",
      root_url: "https://b.com",
      created_at: "2024-01-01T00:00:00.000Z",
      cookies: [
        { name: "session", domain: "b.com" },
        { name: "tracker", domain: "b.com" },
      ],
    };

    const result = aggregateData([recordA, recordB], sumTrustScore);

    expect(result).toHaveLength(2);
    const byUrl = Object.fromEntries(result.map((r) => [r.root_url, r]));
    expect(byUrl["https://a.com"].cookie_count).toBe(1);
    expect(byUrl["https://b.com"].cookie_count).toBe(2);
  });

  it("averages trust scores across multiple records for non-locallens origins", () => {
    const calc = vi
      .fn<TrustScoreCalculator>()
      .mockReturnValueOnce(0.8)
      .mockReturnValueOnce(0.4);

    const records: RawRecord[] = [
      { id: "r1", root_url: "https://example.com", created_at: "2024-01-01T00:00:00.000Z" },
      { id: "r2", root_url: "https://example.com", created_at: "2024-01-02T00:00:00.000Z" },
    ];

    const result = aggregateData(records, calc);

    expect(result).toHaveLength(1);
    expect(result[0].trust_score).toBeCloseTo(0.6); // average of 0.8 and 0.4
  });

  it("filters LocalLens's own storage keys and PT-tagged ids for the locallens.local origin", () => {
    const record: RawRecord = {
      id: "ptAbc123",
      root_url: "https://locallens.local",
      created_at: "2024-01-01T00:00:00.000Z",
      cookies: [{ name: "session", domain: "locallens.local" }],
      local_storage: {
        permissionTrail_data: "x", // filtered: starts with "permissionTrail"
        "pt:something": "y", // filtered: starts with "pt:"
        normalKey: "z", // kept
      },
    };

    const result = aggregateData([record], calculateTrustScore);

    expect(result).toHaveLength(1);
    const row = result[0];

    // "normalKey" survives the permissionTrail/pt: filter, but is then
    // reduced to 0 because the record's own id is PT-tagged ("pt..." prefix).
    expect(row.local_storage_count).toBe(0);
    expect(row.cookie_count).toBe(1);
    // For the locallens origin, trust_score is computed directly (not averaged).
    expect(row.trust_score).toBeCloseTo(0.9653, 4);
  });
});
