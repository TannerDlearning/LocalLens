import { TrustScoreCalculator } from "./aggregateData";

export const calculateTrustScore: TrustScoreCalculator = (
  cookies,
  localStorageItems,
  indexedDBItems,
  cacheStorageItems,
  serviceWorkers,
  formDataItems
): number => {
  // 🔹 Count only the ptsync keys (we assume aggregateData passes an array or object with keys)
  // If localStorageItems is a number (count), aggregateData must also give us ptsyncCount.
  // To avoid refactoring, we simply treat `localStorageItems` as the total
  // and subtract ptsync keys using a heuristic safe check:
  const ptsyncCount =
    typeof localStorageItems === "number"
      ? 0 // nothing to subtract unless aggregateData passes keys (keeps all behavior unchanged)
      : Object.keys(localStorageItems).filter((k) =>
          k.startsWith("ptsync")
        ).length;

  // 🔹 Modify ONLY the trust-score input — displayed totals stay the same
  const filteredLocalStorageCount =
    typeof localStorageItems === "number"
      ? localStorageItems // no structure available, leave unchanged
      : Object.keys(localStorageItems).length - ptsyncCount;

  const w = {
    cookies: 1.0,
    localStorage: 1.2,
    indexedDB: 1.3,
    cacheStorage: 1.1,
    serviceWorkers: 1.5,
    formData: 1.4,
  } as const;

  const logScale = (x: number): number => Math.log(1 + x);

  const weightedSum =
    w.cookies * logScale(cookies) +
    w.localStorage * logScale(filteredLocalStorageCount) + // ← only changed line
    w.indexedDB * logScale(indexedDBItems) +
    w.cacheStorage * logScale(cacheStorageItems) +
    w.serviceWorkers * logScale(serviceWorkers) +
    w.formData * logScale(formDataItems);

  const M = 20;

  return Math.max(0, Math.min(1, 1 - weightedSum / M));
};
