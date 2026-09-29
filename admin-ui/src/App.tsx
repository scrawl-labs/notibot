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

function BotLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="2.6" r="1.1" fill="#111" />
      <line x1="12" y1="3.6" x2="12" y2="5.6" stroke="#111" strokeWidth="1.4" />
      <rect x="4" y="5.6" width="16" height="13" rx="4" stroke="#111" strokeWidth="1.6" />
      <circle cx="9" cy="11.6" r="1.4" fill="#111" />
      <circle cx="15" cy="11.6" r="1.4" fill="#111" />
      <line x1="9" y1="15.6" x2="15" y2="15.6" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="1.5" y1="10.5" x2="1.5" y2="14" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="22.5" y1="10.5" x2="22.5" y2="14" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function App() {
  const [view, setView] = useState<ViewKey>("events");

  return (
    <div>
      <header
        style={{
          background: "var(--color-bg-elevated, #fff)",
          borderBottom: "1px solid var(--color-border, #e5e5e5)",
          padding: "0 32px",
        }}
      >
        <HStack vAlign="center" gap={8} style={{ height: 64, maxWidth: 1120, margin: "0 auto" }}>
          <HStack vAlign="center" gap={2}>
            <BotLogo />
            <Heading level={1} accessibilityLevel={1}>
              notibot
            </Heading>
          </HStack>
          <TabList value={view} onChange={(v) => setView(v as ViewKey)} size="sm">
            <Tab value="events" label="Event Log" />
            <Tab value="rules" label="Trigger Rules" />
            <Tab value="templates" label="DM Templates" />
            <Tab value="accounts" label="Accounts" />
          </TabList>
        </HStack>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px" }}>
        {view === "events" && <EventsView />}
        {view === "rules" && <RulesView />}
        {view === "templates" && <TemplatesView />}
        {view === "accounts" && <AccountsView />}
      </main>
    </div>
  );
}
