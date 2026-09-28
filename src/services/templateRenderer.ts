export function renderTemplate(body: string, vars: Record<string, string | undefined>): string {
  return body.replace(/{{\s*(\w+)\s*}}/g, (match, key: string) => vars[key] ?? match);
}
