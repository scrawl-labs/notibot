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

  const accountOptions = [{ value: "", label: "All" }, ...accounts.map((a) => ({ value: a.id, label: a.username ?? a.igUserId }))];
  const statusOptions = [{ value: "", label: "All" }, ...STATUS_OPTIONS.map((s) => ({ value: s, label: s }))];

  return (
    <Card padding={6}>
      <HStack gap={4} wrap="wrap" style={{ marginBottom: 20 }} vAlign="end">
        <Selector label="Account" options={accountOptions} value={accountId} onChange={(v) => setAccountId(v ?? "")} size="sm" />
        <Selector label="Status" options={statusOptions} value={dmStatus} onChange={(v) => setDmStatus(v ?? "")} size="sm" />
        <Button label="Reset" variant="ghost" size="sm" onClick={() => { setAccountId(""); setDmStatus(""); }} />
      </HStack>

      {!isLoading && events.length === 0 ? (
        <EmptyState title="No events recorded yet" />
      ) : (
        <Table<CommentEvent>
          data={events}
          idKey="id"
          density="compact"
          hasHover
          isStriped
          columns={[
            {
              key: "createdAt",
              header: "Time",
              width: pixel(140),
              renderCell: (e) => <Text className="mono" size="sm" color="secondary">{e.createdAt.replace("T", " ").slice(0, 19)}</Text>,
            },
            { key: "account", header: "Account", width: pixel(100), renderCell: (e) => e.account.username ?? e.account.igUserId },
            { key: "mediaId", header: "Media", width: pixel(100), renderCell: (e) => <Text className="mono" size="sm">{e.mediaId}</Text> },
            { key: "text", header: "Comment", width: proportional(2), renderCell: (e) => e.text },
            {
              key: "fromUsername",
              header: "From",
              width: pixel(100),
              renderCell: (e) => <Text size="sm" color="secondary">{e.fromUsername ?? e.fromUserId ?? "-"}</Text>,
            },
            { key: "matchedRule", header: "Keyword", width: pixel(100), renderCell: (e) => e.matchedRule?.keyword ?? "-" },
            {
              key: "dmStatus",
              header: "Status",
              width: pixel(100),
              renderCell: (e) => <Badge variant={STATUS_VARIANT[e.dmStatus]} label={e.dmStatus} />,
            },
            {
              key: "errorMessage",
              header: "Note",
              width: proportional(1),
              renderCell: (e) => <Text size="sm" color="secondary">{e.errorMessage ?? ""}</Text>,
            },
          ]}
        />
      )}
    </Card>
  );
}
