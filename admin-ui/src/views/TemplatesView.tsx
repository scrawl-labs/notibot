import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Table, proportional, pixel } from "@astryxdesign/core/Table";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Text } from "@astryxdesign/core/Text";
import { api, ApiError, type DmTemplate } from "../api";

export function TemplatesView() {
  const [templates, setTemplates] = useState<DmTemplate[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => api.templates.list().then(setTemplates);

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    setError(null);
    try {
      await api.templates.create({ name, body });
      setName("");
      setBody("");
      await refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to create template.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await api.templates.remove(id);
    await refresh();
  }

  return (
    <>
      {error && <Banner status="error" title={error} isDismissable onDismiss={() => setError(null)} style={{ marginBottom: 20 }} />}

      <Card padding={6} style={{ marginBottom: 20 }}>
        <div style={{ maxWidth: 320, marginBottom: 16 }}>
          <TextInput label="Name" placeholder="cucumber" value={name} onChange={setName} isRequired size="sm" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <TextArea
            label="Body ({{username}} available)"
            placeholder="Hi {{username}}! Here's the lowest price link: ..."
            value={body}
            onChange={setBody}
            rows={3}
            isRequired
          />
        </div>
        <Button label="Add Template" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!name || !body} />
      </Card>

      <Card padding={6}>
        {templates.length === 0 ? (
          <EmptyState title="No templates registered yet" />
        ) : (
          <Table<DmTemplate>
            data={templates}
            idKey="id"
            density="compact"
            hasHover
            isStriped
            columns={[
              { key: "name", header: "Name", width: proportional(1) },
              {
                key: "body",
                header: "Body",
                width: proportional(3),
                renderCell: (t) => (
                  <Text className="mono" size="sm" maxLines={1}>
                    {t.body}
                  </Text>
                ),
              },
              {
                key: "createdAt",
                header: "Created",
                width: pixel(110),
                renderCell: (t) => <Text className="mono" size="sm" color="secondary">{t.createdAt.slice(0, 10)}</Text>,
              },
              {
                key: "actions",
                header: "",
                width: pixel(80),
                renderCell: (t) => <Button label="Delete" variant="ghost" size="sm" onClick={() => handleDelete(t.id)} />,
              },
            ]}
          />
        )}
      </Card>
    </>
  );
}
