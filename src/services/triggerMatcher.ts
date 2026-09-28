import type { MatchType, TriggerRule } from "@prisma/client";

export function ruleMatches(rule: Pick<TriggerRule, "keyword" | "matchType">, text: string): boolean {
  const normalizedText = text.trim().toLowerCase();
  const normalizedKeyword = rule.keyword.trim().toLowerCase();

  switch (rule.matchType as MatchType) {
    case "EXACT":
      return normalizedText === normalizedKeyword;
    case "CONTAINS":
      return normalizedText.includes(normalizedKeyword);
    case "REGEX": {
      try {
        const re = new RegExp(rule.keyword, "i");
        return re.test(text);
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

/**
 * Picks the best matching rule for a comment. Rules scoped to the specific
 * media (mediaId set) take priority over account-wide rules (mediaId null);
 * within the same scope, higher `priority` wins, then most recently created.
 */
export function findMatchingRule<T extends Pick<TriggerRule, "keyword" | "matchType" | "isActive" | "mediaId" | "priority" | "createdAt">>(
  rules: T[],
  mediaId: string,
  text: string,
): T | null {
  const candidates = rules.filter((rule) => rule.isActive && ruleMatches(rule, text));

  const scoped = candidates.filter((rule) => rule.mediaId === mediaId);
  const global = candidates.filter((rule) => rule.mediaId === null);
  const pool = scoped.length > 0 ? scoped : global;

  if (pool.length === 0) return null;

  return pool.slice().sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.createdAt.getTime() - a.createdAt.getTime();
  })[0];
}
