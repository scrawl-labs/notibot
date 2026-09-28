import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Table, proportional, pixel } from "@astryxdesign/core/Table";
import { Badge } from "@astryxdesign/core/Badge";
import { Selector } from "@astryxdesign/core/Selector";
import { Button } from "@astryxdesign/core/Button";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { api, type Account, type CommentEvent, type DmStatus } from "../api";

const STATUS_VARIANT: Record<DmStatus, "success" | "error" | "neutral" | "warning"> = {
  SENT: "success",
  FAILED: "error",
  NO_MATCH: "neutral",
  SKIPPED: "warning",
};

const STATUS_OPTIONS = ["SENT", "FAILED", "NO_MATCH", "SKIPPED"];

export function EventsView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [events, setEvents] = useState<CommentEvent[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [dmStatus, setDmStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.accounts.list().then(setAccounts);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api.events
      .list({ accountId: accountId || undefined, dmStatus: dmStatus || undefined })
      .then(setEvents)
      .finally(() => setIsLoading(false));
  }, [accountId, dmStatus]);

  const accountOptions = [{ value: "", label: "전체" }, ...accounts.map((a) => ({ value: a.id, label: a.username ?? a.igUserId }))];
  const statusOptions = [{ value: "", label: "전체" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))];

  return (
    <Card>
      <HStack gap={3} wrap="wrap" style={{ marginBottom: 16 }} vAlign="end">
        <Selector label="계정" options={accountOptions} value={accountId} onChange={(v) => setAccountId(v ?? "")} size="sm" />
        <Selector label="상태" options={statusOptions} value={dmStatus} onChange={(v) => setDmStatus(v ?? "")} size="sm" />
        <Button label="초기화" variant="ghost" size="sm" onClick={() => { setAccountId(""); setDmStatus(""); }} />
      </HStack>

      {!isLoading && events.length === 0 ? (
        <EmptyState title="아직 기록된 이벤트가 없습니다" />
      ) : (
        <div className="notibot-table-wrap">
          <Table<CommentEvent>
            data={events}
            idKey="id"
            density="compact"
            hasHover
            isStriped
            columns={[
              {
                key: "createdAt",
                header: "시간",
                width: pixel(140),
                renderCell: (e) => <Text className="mono" size="sm" color="secondary">{e.createdAt.replace("T", " ").slice(0, 19)}</Text>,
              },
              { key: "account", header: "계정", width: pixel(100), renderCell: (e) => e.account.username ?? e.account.igUserId },
              { key: "mediaId", header: "미디어", width: pixel(100), renderCell: (e) => <Text className="mono" size="sm">{e.mediaId}</Text> },
              { key: "text", header: "댓글", width: proportional(2), renderCell: (e) => e.text },
              {
                key: "fromUsername",
                header: "작성자",
                width: pixel(100),
                renderCell: (e) => <Text size="sm" color="secondary">{e.fromUsername ?? e.fromUserId ?? "-"}</Text>,
              },
              { key: "matchedRule", header: "매칭 키워드", width: pixel(100), renderCell: (e) => e.matchedRule?.keyword ?? "-" },
              {
                key: "dmStatus",
                header: "상태",
                width: pixel(100),
                renderCell: (e) => <Badge variant={STATUS_VARIANT[e.dmStatus]} label={e.dmStatus} />,
              },
              {
                key: "errorMessage",
                header: "비고",
                width: proportional(1),
                renderCell: (e) => <Text size="sm" color="secondary">{e.errorMessage ?? ""}</Text>,
              },
            ]}
          />
        </div>
      )}
    </Card>
  );
}
