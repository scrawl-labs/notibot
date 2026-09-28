import { describe, expect, it } from "vitest";
import { findMatchingRule, ruleMatches } from "../src/services/triggerMatcher.js";

function rule(overrides: Partial<Parameters<typeof ruleMatches>[0]> & { mediaId?: string | null; priority?: number; isActive?: boolean; createdAt?: Date } = {}) {
  return {
    keyword: "오이",
    matchType: "CONTAINS" as const,
    mediaId: null,
    priority: 0,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("ruleMatches", () => {
  it("matches CONTAINS case-insensitively with surrounding text", () => {
    expect(ruleMatches(rule({ keyword: "오이" }), "오이 달아주세요!")).toBe(true);
    expect(ruleMatches(rule({ keyword: "오이" }), "오이 좋아요")).toBe(true);
    expect(ruleMatches(rule({ keyword: "오이" }), "수박 주세요")).toBe(false);
  });

  it("matches EXACT only on full normalized equality", () => {
    expect(ruleMatches(rule({ keyword: "오이", matchType: "EXACT" }), "오이")).toBe(true);
    expect(ruleMatches(rule({ keyword: "오이", matchType: "EXACT" }), " 오이 ")).toBe(true);
    expect(ruleMatches(rule({ keyword: "오이", matchType: "EXACT" }), "오이 주세요")).toBe(false);
  });

  it("matches REGEX case-insensitively and fails closed on bad patterns", () => {
    expect(ruleMatches(rule({ keyword: "오이|cucumber", matchType: "REGEX" }), "I want CUCUMBER")).toBe(true);
    expect(ruleMatches(rule({ keyword: "(", matchType: "REGEX" }), "anything")).toBe(false);
  });
});

describe("findMatchingRule", () => {
  it("prefers a media-scoped rule over an account-wide one", () => {
    const global = rule({ keyword: "오이", mediaId: null, priority: 5 });
    const scoped = rule({ keyword: "오이", mediaId: "media-1", priority: 0 });

    const result = findMatchingRule([global, scoped], "media-1", "오이 주세요");
    expect(result).toBe(scoped);
  });

  it("falls back to a global rule when no media-scoped rule matches", () => {
    const global = rule({ keyword: "오이", mediaId: null });
    const otherMedia = rule({ keyword: "오이", mediaId: "media-2" });

    const result = findMatchingRule([global, otherMedia], "media-1", "오이 주세요");
    expect(result).toBe(global);
  });

  it("breaks ties within the same scope by priority then recency", () => {
    const older = rule({ keyword: "오이", priority: 1, createdAt: new Date("2024-01-01") });
    const newer = rule({ keyword: "오이", priority: 1, createdAt: new Date("2024-06-01") });
    const lowerPriority = rule({ keyword: "오이", priority: 0, createdAt: new Date("2025-01-01") });

    const result = findMatchingRule([older, newer, lowerPriority], "media-1", "오이");
    expect(result).toBe(newer);
  });

  it("ignores inactive rules and rules that don't match the text", () => {
    const inactive = rule({ keyword: "오이", isActive: false });
    const nonMatching = rule({ keyword: "수박" });

    const result = findMatchingRule([inactive, nonMatching], "media-1", "오이");
    expect(result).toBeNull();
  });

  it("returns null when there are no candidate rules", () => {
    expect(findMatchingRule([], "media-1", "오이")).toBeNull();
  });
});
