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
      setError(e instanceof ApiError ? e.message : "템플릿 생성에 실패했습니다.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("삭제할까요?")) return;
    await api.templates.remove(id);
    await refresh();
  }

  return (
    <>
      {error && <Banner status="error" title={error} isDismissable onDismiss={() => setError(null)} style={{ marginBottom: 16 }} />}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ maxWidth: 320, marginBottom: 12 }}>
          <TextInput label="이름" placeholder="cucumber" value={name} onChange={setName} isRequired size="sm" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <TextArea
            label="본문 ({{username}} 사용 가능)"
            placeholder="안녕하세요 {{username}}님! 최저가 링크는 ... 입니다"
            value={body}
            onChange={setBody}
            rows={3}
            isRequired
          />
        </div>
        <Button label="템플릿 추가" variant="primary" size="sm" clickAction={handleCreate} isDisabled={!name || !body} />
      </Card>

      <Card>
        {templates.length === 0 ? (
          <EmptyState title="등록된 템플릿이 없습니다" />
        ) : (
          <div className="notibot-table-wrap">
            <Table<DmTemplate>
              data={templates}
              idKey="id"
              density="compact"
              hasHover
              isStriped
              columns={[
                { key: "name", header: "이름", width: proportional(1) },
                {
                  key: "body",
                  header: "본문",
                  width: proportional(3),
                  renderCell: (t) => (
                    <Text className="mono" size="sm" maxLines={1}>
                      {t.body}
                    </Text>
                  ),
                },
                {
                  key: "createdAt",
                  header: "생성일",
                  width: pixel(110),
                  renderCell: (t) => <Text className="mono" size="sm" color="secondary">{t.createdAt.slice(0, 10)}</Text>,
                },
                {
                  key: "actions",
                  header: "",
                  width: pixel(70),
                  renderCell: (t) => <Button label="삭제" variant="ghost" size="sm" onClick={() => handleDelete(t.id)} />,
                },
              ]}
            />
          </div>
        )}
      </Card>
    </>
  );
}
