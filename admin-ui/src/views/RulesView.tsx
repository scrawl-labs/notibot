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
      setError(e instanceof ApiError ? e.message : "규칙 생성에 실패했습니다.");
    }
  }

  async function handleToggle(rule: TriggerRule) {
    await api.rules.setActive(rule.id, !rule.isActive);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제할까요?")) return;
    await api.rules.remove(id);
    await refresh();
  }

  const canCreate = accounts.length > 0 && templates.length > 0;

  return (
    <>
      {error && (
        <Banner status="error" title={error} isDismissable onDismiss={() => setError(null)} style={{ marginBottom: 16 }} />
      )}

      <Card style={{ marginBottom: 16 }}>
        {!canCreate ? (
          <Text color="secondary">규칙을 만들려면 먼저 계정과 DM 템플릿을 하나 이상 등록하세요.</Text>
        ) : (
          <>
            <Grid columns={6} gap={3} style={{ marginBottom: 12 }}>
              <Selector
                label="계정"
                options={accounts.map((a) => ({ value: a.id, label: a.username ?? a.igUserId }))}
                value={accountId}
                onChange={(v) => setAccountId(v ?? "")}
                size="sm"
              />
              <TextInput label="미디어 ID (선택)" placeholder="media-123" value={mediaId} onChange={setMediaId} size="sm" />
              <TextInput label="키워드" placeholder="오이" value={keyword} onChange={setKeyword} isRequired size="sm" />
              <Selector
                label="매칭 방식"
                options={MATCH_TYPE_OPTIONS}
                value={matchType}
                onChange={(v) => setMatchType((v ?? "CONTAINS") as MatchType)}
                size="sm"
              />
              <Selector
                label="DM 템플릿"
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
                value={dmTemplateId}
                onChange={(v) => setDmTemplateId(v ?? "")}
                size="sm"
              />
              <TextInput label="우선순위" value={priority} onChange={setPriority} size="sm" />
            </Grid>
            <Button label="규칙 추가" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!keyword} />
          </>
        )}
      </Card>

      <Card>
        {rules.length === 0 ? (
          <EmptyState title="등록된 트리거 규칙이 없습니다" />
        ) : (
          <div className="notibot-table-wrap">
            <Table<TriggerRule>
              data={rules}
              idKey="id"
              density="compact"
              hasHover
              isStriped
              columns={[
                { key: "account", header: "계정", width: proportional(1), renderCell: (r) => r.account.username ?? r.account.igUserId },
                {
                  key: "mediaId",
                  header: "범위",
                  width: proportional(1),
                  renderCell: (r) => <Text className="mono" size="sm" color="secondary">{r.mediaId ?? "전체"}</Text>,
                },
                { key: "keyword", header: "키워드", width: proportional(1), renderCell: (r) => r.keyword },
                { key: "matchType", header: "방식", width: pixel(100), renderCell: (r) => <Text size="sm" color="secondary">{r.matchType}</Text> },
                { key: "dmTemplate", header: "템플릿", width: proportional(1), renderCell: (r) => r.dmTemplate.name },
                { key: "priority", header: "우선순위", width: pixel(80), renderCell: (r) => <Text size="sm" color="secondary">{r.priority}</Text> },
                {
                  key: "isActive",
                  header: "상태",
                  width: pixel(90),
                  renderCell: (r) => <Badge variant={r.isActive ? "success" : "neutral"} label={r.isActive ? "활성" : "비활성"} />,
                },
                {
                  key: "actions",
                  header: "",
                  width: pixel(160),
                  renderCell: (r) => (
                    <HStack gap={1}>
                      <Button label={r.isActive ? "비활성화" : "활성화"} variant="ghost" size="sm" clickAction={() => handleToggle(r)} />
                      <Button label="삭제" variant="ghost" size="sm" onClick={() => handleDelete(r.id)} />
                    </HStack>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Card>
    </>
  );
}
