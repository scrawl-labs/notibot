import { useState } from "react";
import { Heading } from "@astryxdesign/core/Heading";
import { TabList } from "@astryxdesign/core/TabList";
import { Tab } from "@astryxdesign/core/TabList";
import { HStack } from "@astryxdesign/core/HStack";
import { EventsView } from "./views/EventsView";
import { RulesView } from "./views/RulesView";
import { TemplatesView } from "./views/TemplatesView";
import { AccountsView } from "./views/AccountsView";

type ViewKey = "events" | "rules" | "templates" | "accounts";

export function App() {
  const [view, setView] = useState<ViewKey>("events");

  return (
    <div>
      <header
        style={{
          background: "var(--color-bg-elevated, #fff)",
          borderBottom: "1px solid var(--color-border, #e5e5e5)",
          padding: "0 24px",
        }}
      >
        <HStack vAlign="center" gap={6} style={{ height: 56, maxWidth: 1080, margin: "0 auto" }}>
          <Heading level={1} accessibilityLevel={1}>
            notibot
          </Heading>
          <TabList value={view} onChange={(v) => setView(v as ViewKey)} size="sm">
            <Tab value="events" label="이벤트 로그" />
            <Tab value="rules" label="트리거 규칙" />
            <Tab value="templates" label="DM 템플릿" />
            <Tab value="accounts" label="계정" />
          </TabList>
        </HStack>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "24px" }}>
        {view === "events" && <EventsView />}
        {view === "rules" && <RulesView />}
        {view === "templates" && <TemplatesView />}
        {view === "accounts" && <AccountsView />}
      </main>
    </div>
  );
}
