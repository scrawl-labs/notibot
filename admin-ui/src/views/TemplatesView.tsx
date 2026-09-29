import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Table, proportional, pixel } from "@astryxdesign/core/Table";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Selector } from "@astryxdesign/core/Selector";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Grid } from "@astryxdesign/core/Grid";
import { Text } from "@astryxdesign/core/Text";
import { api, ApiError, type DmMessageType, type DmTemplate } from "../api";

const MESSAGE_TYPE_OPTIONS = ["TEXT", "IMAGE", "GENERIC"];
const MESSAGE_TYPE_VARIANT: Record<DmMessageType, "neutral" | "info" | "success"> = {
  TEXT: "neutral",
  IMAGE: "info",
  GENERIC: "success",
};

export function TemplatesView() {
  const [templates, setTemplates] = useState<DmTemplate[]>([]);
  const [name, setName] = useState("");
  const [messageType, setMessageType] = useState<DmMessageType>("TEXT");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [buttonLabel, setButtonLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => api.templates.list().then(setTemplates);

  useEffect(() => {
    refresh();
  }, []);

  const needsBody = messageType === "TEXT" || messageType === "GENERIC";
  const needsImage = messageType === "IMAGE" || messageType === "GENERIC";
  const needsButton = messageType === "GENERIC";

  const canCreate =
    !!name &&
    (!needsBody || !!body) &&
    (!needsImage || !!imageUrl) &&
    (!needsButton || (!!buttonUrl && !!buttonLabel));

  async function handleCreate() {
    setError(null);
    try {
      await api.templates.create({
        name,
        messageType,
        body: needsBody ? body : undefined,
        imageUrl: needsImage ? imageUrl : undefined,
        buttonUrl: needsButton ? buttonUrl : undefined,
        buttonLabel: needsButton ? buttonLabel : undefined,
      });
      setName("");
      setBody("");
      setImageUrl("");
      setButtonUrl("");
      setButtonLabel("");
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
        <Grid columns={{ minWidth: 220, max: 3, repeat: "fit" }} gap={4} style={{ marginBottom: 16 }}>
          <TextInput label="Name" placeholder="cucumber" value={name} onChange={setName} isRequired size="sm" />
          <Selector
            label="Message Type"
            options={MESSAGE_TYPE_OPTIONS}
            value={messageType}
            onChange={(v) => setMessageType((v ?? "TEXT") as DmMessageType)}
            size="sm"
          />
        </Grid>

        {needsBody && (
          <div style={{ marginBottom: 16 }}>
            <TextArea
              label={messageType === "GENERIC" ? "Title ({{username}} available)" : "Body ({{username}} available)"}
              placeholder="Hi {{username}}! Here's the lowest price link: ..."
              value={body}
              onChange={setBody}
              rows={3}
              isRequired
            />
          </div>
        )}

        {needsImage && (
          <div style={{ maxWidth: 480, marginBottom: 16 }}>
            <TextInput label="Image URL" placeholder="https://..." value={imageUrl} onChange={setImageUrl} isRequired size="sm" />
          </div>
        )}

        {needsButton && (
          <Grid columns={{ minWidth: 220, max: 2, repeat: "fit" }} gap={4} style={{ marginBottom: 16 }}>
            <TextInput label="Button URL" placeholder="https://coupa.ng/..." value={buttonUrl} onChange={setButtonUrl} isRequired size="sm" />
            <TextInput label="Button Label" placeholder="Buy Now" value={buttonLabel} onChange={setButtonLabel} isRequired size="sm" />
          </Grid>
        )}

        <Button label="Add Template" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!canCreate} />
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
                key: "messageType",
                header: "Type",
                width: pixel(100),
                renderCell: (t) => <Badge variant={MESSAGE_TYPE_VARIANT[t.messageType]} label={t.messageType} />,
              },
              {
                key: "body",
                header: "Body / Title",
                width: proportional(2),
                renderCell: (t) => (
                  <Text className="mono" size="sm" maxLines={1}>
                    {t.body ?? "-"}
                  </Text>
                ),
              },
              {
                key: "imageUrl",
                header: "Image URL",
                width: proportional(2),
                renderCell: (t) => (
                  <Text className="mono" size="sm" color="secondary" maxLines={1}>
                    {t.imageUrl ?? "-"}
                  </Text>
                ),
              },
              {
                key: "buttonLabel",
                header: "Button",
                width: proportional(1),
                renderCell: (t) => (t.buttonUrl ? <Text size="sm">{t.buttonLabel}</Text> : "-"),
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
