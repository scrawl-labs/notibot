import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Table, proportional, pixel } from "@astryxdesign/core/Table";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Text } from "@astryxdesign/core/Text";
import { api, ApiError, type Account } from "../api";

export function AccountsView() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [igUserId, setIgUserId] = useState("");
  const [username, setUsername] = useState("");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => api.accounts.list().then(setAccounts);

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    setError(null);
    try {
      await api.accounts.create({ igUserId, username: username || undefined, pageAccessToken });
      setIgUserId("");
      setUsername("");
      setPageAccessToken("");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "계정 생성에 실패했습니다.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제할까요? 연결된 트리거 규칙도 함께 삭제됩니다.")) return;
    await api.accounts.remove(id);
    await refresh();
  }

  return (
    <>
      {error && <Banner status="error" title={error} isDismissable onDismiss={() => setError(null)} style={{ marginBottom: 16 }} />}

      <Card style={{ marginBottom: 16 }}>
        <Grid columns={3} gap={3} style={{ marginBottom: 12 }}>
          <TextInput label="Instagram User ID" placeholder="179xxxxxxxxxxxx" value={igUserId} onChange={setIgUserId} isRequired size="sm" />
          <TextInput label="이름 (표시용)" placeholder="my_shop" value={username} onChange={setUsername} size="sm" />
          <TextInput label="Page Access Token" placeholder="Meta에서 발급받은 토큰" value={pageAccessToken} onChange={setPageAccessToken} isRequired size="sm" />
        </Grid>
        <Button label="계정 추가" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!igUserId || !pageAccessToken} />
      </Card>

      <Card>
        {accounts.length === 0 ? (
          <EmptyState title="등록된 계정이 없습니다" />
        ) : (
          <div className="notibot-table-wrap">
            <Table<Account>
              data={accounts}
              idKey="id"
              density="compact"
              hasHover
              isStriped
              columns={[
                { key: "igUserId", header: "IG User ID", width: proportional(1), renderCell: (a) => <Text className="mono" size="sm">{a.igUserId}</Text> },
                { key: "username", header: "이름", width: proportional(1), renderCell: (a) => a.username ?? "-" },
                {
                  key: "createdAt",
                  header: "등록일",
                  width: pixel(110),
                  renderCell: (a) => <Text className="mono" size="sm" color="secondary">{a.createdAt.slice(0, 10)}</Text>,
                },
                {
                  key: "actions",
                  header: "",
                  width: pixel(70),
                  renderCell: (a) => <Button label="삭제" variant="ghost" size="sm" onClick={() => handleDelete(a.id)} />,
                },
              ]}
            />
          </div>
        )}
      </Card>
    </>
  );
}
