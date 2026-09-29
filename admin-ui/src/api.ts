export interface Account {
  [key: string]: unknown;
  id: string;
  igUserId: string;
  username: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DmMessageType = "TEXT" | "IMAGE" | "GENERIC";

export interface DmTemplate {
  [key: string]: unknown;
  id: string;
  name: string;
  messageType: DmMessageType;
  body: string | null;
  imageUrl: string | null;
  buttonUrl: string | null;
  buttonLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MatchType = "EXACT" | "CONTAINS" | "REGEX";
export type DmStatus = "SENT" | "FAILED" | "SKIPPED" | "NO_MATCH";

export interface TriggerRule {
  [key: string]: unknown;
  id: string;
  accountId: string;
  mediaId: string | null;
  keyword: string;
  matchType: MatchType;
  isActive: boolean;
  priority: number;
  dmTemplateId: string;
  createdAt: string;
  updatedAt: string;
  account: Account;
  dmTemplate: DmTemplate;
}

export interface CommentEvent {
  [key: string]: unknown;
  id: string;
  accountId: string;
  mediaId: string;
  commentId: string;
  fromUsername: string | null;
  fromUserId: string | null;
  text: string;
  matchedRuleId: string | null;
  dmStatus: DmStatus;
  errorMessage: string | null;
  createdAt: string;
  account: Account;
  matchedRule: TriggerRule | null;
}

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiError(body?.error ?? `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  accounts: {
    list: () => request<Account[]>("/accounts"),
    create: (data: { igUserId: string; username?: string; pageAccessToken: string }) =>
      request<Account>("/accounts", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/accounts/${id}`, { method: "DELETE" }),
  },
  templates: {
    list: () => request<DmTemplate[]>("/dm-templates"),
    create: (data: {
      name: string;
      messageType: DmMessageType;
      body?: string;
      imageUrl?: string;
      buttonUrl?: string;
      buttonLabel?: string;
    }) => request<DmTemplate>("/dm-templates", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request<void>(`/dm-templates/${id}`, { method: "DELETE" }),
  },
  rules: {
    list: () => request<TriggerRule[]>("/trigger-rules"),
    create: (data: {
      accountId: string;
      mediaId?: string;
      keyword: string;
      matchType: MatchType;
      dmTemplateId: string;
      priority: number;
    }) => request<TriggerRule>("/trigger-rules", { method: "POST", body: JSON.stringify(data) }),
    setActive: (id: string, isActive: boolean) =>
      request<TriggerRule>(`/trigger-rules/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    remove: (id: string) => request<void>(`/trigger-rules/${id}`, { method: "DELETE" }),
  },
  events: {
    list: (filters: { accountId?: string; dmStatus?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.accountId) params.set("accountId", filters.accountId);
      if (filters.dmStatus) params.set("dmStatus", filters.dmStatus);
      const qs = params.toString();
      return request<CommentEvent[]>(`/events${qs ? `?${qs}` : ""}`);
    },
  },
};
