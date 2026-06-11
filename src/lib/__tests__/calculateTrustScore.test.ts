import { describe, it, expect } from "vitest";
import { calculateTrustScore } from "../calculateTrustScore";

describe("calculateTrustScore", () => {
  it("returns the maximum score of 1 (100%) for a completely clean site", () => {
    expect(calculateTrustScore(0, 0, 0, 0, 0, 0)).toBe(1);
  });

  it("returns a score close to but below 1 for a lightly tracked site", () => {
    const score = calculateTrustScore(1, 0, 0, 0, 0, 0);
    expect(score).toBeGreaterThan(0.9);
    expect(score).toBeLessThan(1);
    expect(score).toBeCloseTo(0.9653, 4);
  });

  it("returns a low score for a heavily tracked site", () => {
    const score = calculateTrustScore(20, 20, 10, 10, 5, 5);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(0.3);
  });

  it("clamps the score at 0 for an extremely tracked site", () => {
    const score = calculateTrustScore(50, 50, 50, 50, 10, 10);
    expect(score).toBe(0);
  });

  it("penalizes service workers more heavily than cookies for the same count", () => {
    const cookieScore = calculateTrustScore(5, 0, 0, 0, 0, 0);
    const workerScore = calculateTrustScore(0, 0, 0, 0, 5, 0);
    expect(workerScore).toBeLessThan(cookieScore);
  });

  it("penalizes form data more heavily than cookies for the same count", () => {
    const cookieScore = calculateTrustScore(5, 0, 0, 0, 0, 0);
    const formScore = calculateTrustScore(0, 0, 0, 0, 0, 5);
    expect(formScore).toBeLessThan(cookieScore);
  });
});
