function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  igVerifyToken: required("IG_VERIFY_TOKEN", "change-me"),
  igAppSecret: required("IG_APP_SECRET", "change-me"),
  igGraphApiBaseUrl: process.env.IG_GRAPH_API_BASE_URL ?? "https://graph.facebook.com/v21.0",
};
