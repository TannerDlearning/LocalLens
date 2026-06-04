import { TableRecord } from "../components/data-table";

// 🔑 Shape of the raw rows before aggregation
export interface RawRecord {
  id: string;
  root_url: string;
  created_at: string;
  cookies?: { name: string; domain: string }[];
  local_storage?: Record<string, string>;
  indexeddb?: { name: string; version: string }[];
  service_workers?: string[];
  form_data?: string[];
  cache_storage?: string[];
}

// 🔑 Trust score calculator signature
export type TrustScoreCalculator = (
  cookieCount: number,
  localStorageCount: number,
  indexedDBCount: number,
  cacheCount: number,
  workerCount: number,
  formCount: number
) => number;

/**
 * Aggregate raw records into grouped TableRecord entries
 */
export function aggregateData(
  data: RawRecord[],
  calculateTrustScore: TrustScoreCalculator
): TableRecord[] {
  const grouped: Record<
    string,
    {
      root_url: string;
      cookies: Set<string>;
      local_storage: Set<string>;
      indexeddb: Set<string>;
      service_workers: Set<string>;
      form_data: string[];
      cache_storage: string[];
      trust_scores: number[];
      latest_created_at: string | null;
      ids: string[];
    }
  > = {};

  data.forEach((row) => {
    const domain = row.root_url;

    // ✅ MINIMAL: only used to filter PT's own storage keys on our own site
    const isLocalLens =
      domain === "https://locallens.local" ||
      domain === "https://www.locallens.local";

    if (!grouped[domain]) {
      grouped[domain] = {
        root_url: domain,
        cookies: new Set(),
        local_storage: new Set(),
        indexeddb: new Set(),
        service_workers: new Set(),
        form_data: [],
        cache_storage: [],
        trust_scores: [],
        latest_created_at: null,
        ids: [],
      };
    }

    const group = grouped[domain];

    (row.cookies || []).forEach((c) =>
      group.cookies.add(`${c.name}:${c.domain}`)
    );

    // ✅ MINIMAL CHANGE: filter PT’s own localStorage keys only for PT domain
    Object.keys(row.local_storage || {}).forEach((k) => {
      if (isLocalLens && (k.startsWith("permissionTrail") || k.startsWith("pt:"))) {
        return;
      }
      group.local_storage.add(k);
    });

    (row.indexeddb || []).forEach((db) =>
      group.indexeddb.add(`${db.name}:${db.version}`)
    );
    (row.service_workers || []).forEach((sw) =>
      group.service_workers.add(sw)
    );
    if (row.cache_storage?.length)
      group.cache_storage.push(...row.cache_storage);
    if (row.form_data?.length)
      group.form_data.push(...row.form_data);

    const cookieCount = group.cookies.size;
    const localStorageCount = group.local_storage.size;
    const indexedDBCount = group.indexeddb.size;
    const cacheCount = group.cache_storage.length;
    const workerCount = group.service_workers.size;
    const formCount = group.form_data.length;

    const score = calculateTrustScore(
      cookieCount,
      localStorageCount,
      indexedDBCount,
      cacheCount,
      workerCount,
      formCount
    );

    group.trust_scores.push(score);
    group.ids.push(row.id);

    const timestamp = new Date(row.created_at);
    if (
      !group.latest_created_at ||
      timestamp > new Date(group.latest_created_at)
    ) {
      group.latest_created_at = timestamp.toISOString();
    }
  });

  return Object.values(grouped).map((group) => {
    const isLocalLens =
      group.root_url === "https://locallens.local" ||
      group.root_url === "https://www.locallens.local";

    const isPTId = (id: string) =>
      typeof id === "string" && id.startsWith("pt");

    const rawCookieCount = group.cookies.size;
    const rawLocalStorageCount = group.local_storage.size;
    const rawIndexedDBCount = group.indexeddb.size;

    let cookieCount = rawCookieCount;
    let localStorageCount = rawLocalStorageCount;
    let indexedDBCount = rawIndexedDBCount;

    // 🔹 Filter PT-owned ids only for locallens.local (keeps your existing behaviour)
    if (isLocalLens) {
      const ptIds = group.ids.filter(isPTId).length;

      const trackerTotal =
        rawCookieCount + rawLocalStorageCount + rawIndexedDBCount;

      const filteredTrackerTotal = Math.max(0, trackerTotal - ptIds);

      const reduction = trackerTotal - filteredTrackerTotal;

      if (reduction > 0) {
        // subtract from localStorage first (minimal behaviour change)
        localStorageCount = Math.max(0, localStorageCount - reduction);
      }
    }

    return {
      id: group.ids[0],
      root_url: group.root_url,
      trackers: cookieCount + localStorageCount + indexedDBCount,

      stored_data_types: group.cache_storage.length + group.form_data.length,
      workers: group.service_workers.size,

      cookie_count: cookieCount,
      local_storage_count: localStorageCount,
      indexeddb_count: indexedDBCount,
      cache_storage_count: group.cache_storage.length,
      service_worker_count: group.service_workers.size,
      form_data_count: group.form_data.length,

      trust_score: isLocalLens
        ? calculateTrustScore(
            cookieCount,
            localStorageCount,
            indexedDBCount,
            group.cache_storage.length,
            group.service_workers.size,
            group.form_data.length
          )
        : group.trust_scores.reduce((a, b) => a + b, 0) / group.trust_scores.length,

      created_at: group.latest_created_at,
      ids: group.ids,
    };
  });
}
