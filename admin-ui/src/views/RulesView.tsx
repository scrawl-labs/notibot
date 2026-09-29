import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Table, proportional, pixel } from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { api, ApiError, type Account, type DmTemplate, type MatchType, type TriggerRule } from "../api";

const MATCH_TYPE_OPTIONS = ["CONTAINS", "EXACT", "REGEX"];

export function RulesView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [templates, setTemplates] = useState<DmTemplate[]>([]);
  const [rules, setRules] = useState<TriggerRule[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [accountId, setAccountId] = useState("");
  const [mediaId, setMediaId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("CONTAINS");
  const [dmTemplateId, setDmTemplateId] = useState("");
  const [priority, setPriority] = useState("0");

  const refresh = () =>
    Promise.all([api.accounts.list(), api.templates.list(), api.rules.list()]).then(([a, t, r]) => {
      setAccounts(a);
      setTemplates(t);
      setRules(r);
      if (a[0] && !accountId) setAccountId(a[0].id);
      if (t[0] && !dmTemplateId) setDmTemplateId(t[0].id);
    });

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    setError(null);
    try {
      await api.rules.create({
        accountId,
        mediaId: mediaId || undefined,
        keyword,
        matchType,
        dmTemplateId,
        priority: Number(priority) || 0,
      });
      setMediaId("");
      setKeyword("");
      setPriority("0");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create rule.");
    }
  }

  async function handleToggle(rule: TriggerRule) {
    await api.rules.setActive(rule.id, !rule.isActive);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this rule?")) return;
    await api.rules.remove(id);
    await refresh();
  }

  const canCreate = accounts.length > 0 && templates.length > 0;

  return (
    <>
      {error && (
        <Banner status="error" title={error} isDismissable onDismiss={() => setError(null)} style={{ marginBottom: 20 }} />
      )}

      <Card padding={6} style={{ marginBottom: 20 }}>
        {!canCreate ? (
          <Text color="secondary">To create a rule, first register at least one account and DM template.</Text>
        ) : (
          <>
            <Grid columns={{ minWidth: 150, max: 6, repeat: "fit" }} gap={4} style={{ marginBottom: 16 }}>
              <Selector
                label="Account"
                options={accounts.map((a) => ({ value: a.id, label: a.username ?? a.igUserId }))}
                value={accountId}
                onChange={(v) => setAccountId(v ?? "")}
                size="sm"
              />
              <TextInput label="Media ID (optional)" placeholder="media-123" value={mediaId} onChange={setMediaId} size="sm" />
              <TextInput label="Keyword" placeholder="cucumber" value={keyword} onChange={setKeyword} isRequired size="sm" />
              <Selector
                label="Match Type"
                options={MATCH_TYPE_OPTIONS}
                value={matchType}
                onChange={(v) => setMatchType((v ?? "CONTAINS") as MatchType)}
                size="sm"
              />
              <Selector
                label="DM Template"
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
                value={dmTemplateId}
                onChange={(v) => setDmTemplateId(v ?? "")}
                size="sm"
              />
              <TextInput label="Priority" value={priority} onChange={setPriority} size="sm" />
            </Grid>
            <Button label="Add Rule" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!keyword} />
          </>
        )}
      </Card>

      <Card padding={6}>
        {rules.length === 0 ? (
          <EmptyState title="No trigger rules registered yet" />
        ) : (
          <Table<TriggerRule>
            data={rules}
            idKey="id"
            density="compact"
            hasHover
            isStriped
            columns={[
              { key: "account", header: "Account", width: proportional(1), renderCell: (r) => r.account.username ?? r.account.igUserId },
              {
                key: "mediaId",
                header: "Scope",
                width: proportional(1),
                renderCell: (r) => <Text className="mono" size="sm" color="secondary">{r.mediaId ?? "All"}</Text>,
              },
              { key: "keyword", header: "Keyword", width: proportional(1), renderCell: (r) => r.keyword },
              { key: "matchType", header: "Type", width: pixel(100), renderCell: (r) => <Text size="sm" color="secondary">{r.matchType}</Text> },
              { key: "dmTemplate", header: "Template", width: proportional(1), renderCell: (r) => r.dmTemplate.name },
              { key: "priority", header: "Priority", width: pixel(80), renderCell: (r) => <Text size="sm" color="secondary">{r.priority}</Text> },
              {
                key: "isActive",
                header: "Status",
                width: pixel(90),
                renderCell: (r) => <Badge variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "Active" : "Inactive"} />,
              },
              {
                key: "actions",
                header: "",
                width: pixel(160),
                renderCell: (r) => (
                  <HStack gap={1}>
                    <Button label={r.isActive ? "Deactivate" : "Activate"} variant="ghost" size="sm" clickAction={() => handleToggle(r)} />
                    <Button label="Delete" variant="ghost" size="sm" onClick={() => handleDelete(r.id)} />
                  </HStack>
                ),
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
