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
      setError(e instanceof ApiError ? e.message : "Failed to create account.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this account? Connected trigger rules will also be deleted.")) return;
    await api.accounts.remove(id);
    await refresh();
  }

  return (
    <>
      {error && <Banner status="error" title={error} isDismissable onDismiss={() => setError(null)} style={{ marginBottom: 20 }} />}

      <Card padding={6} style={{ marginBottom: 20 }}>
        <Grid columns={{ minWidth: 220, max: 3, repeat: "fit" }} gap={4} style={{ marginBottom: 16 }}>
          <TextInput label="Instagram User ID" placeholder="179xxxxxxxxxxxx" value={igUserId} onChange={setIgUserId} isRequired size="sm" />
          <TextInput label="Display Name" placeholder="my_shop" value={username} onChange={setUsername} size="sm" />
          <TextInput label="Page Access Token" placeholder="Token issued by Meta" value={pageAccessToken} onChange={setPageAccessToken} isRequired size="sm" />
        </Grid>
        <Button label="Add Account" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!igUserId || !pageAccessToken} />
      </Card>

      <Card padding={6}>
        {accounts.length === 0 ? (
          <EmptyState title="No accounts registered yet" />
        ) : (
          <Table<Account>
            data={accounts}
            idKey="id"
            density="compact"
            hasHover
            isStriped
            columns={[
              { key: "igUserId", header: "IG User ID", width: proportional(1), renderCell: (a) => <Text className="mono" size="sm">{a.igUserId}</Text> },
              { key: "username", header: "Name", width: proportional(1), renderCell: (a) => a.username ?? "-" },
              {
                key: "createdAt",
                header: "Registered",
                width: pixel(110),
                renderCell: (a) => <Text className="mono" size="sm" color="secondary">{a.createdAt.slice(0, 10)}</Text>,
              },
              {
                key: "actions",
                header: "",
                width: pixel(80),
                renderCell: (a) => <Button label="Delete" variant="ghost" size="sm" onClick={() => handleDelete(a.id)} />,
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
