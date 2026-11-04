import type { ReactNode } from "react"

import { TabsPillList } from "../components/navigation/tabs-pill"
import { tabsPillTriggerVariants } from "../components/navigation/tabs-pill-styles"
import { AccountMenu } from "../shell/account-menu"
import { AppHeader } from "../shell/app-header"
import { ACCOUNT_ITEMS, PaigeLogo } from "../stories/fixtures"

/* Story-only: the Vault nav as apps/web's VaultShell draws it, with stub links, so a view's
   stories read as the page a person sees. */
export type Mode = "vault" | "messages" | "memories"

const MODES: Array<[Mode, string]> = [
  ["vault", "Vault"],
  ["messages", "Messages"],
  ["memories", "Memories"],
]

export function StoryVaultShell({ mode = "vault", children }: { mode?: Mode; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        logo={<PaigeLogo />}
        nav={
          <TabsPillList aria-label="Modes">
            {MODES.map(([key, label]) => (
              <a
                key={key}
                href={`#${key}`}
                onClick={(e) => e.preventDefault()}
                aria-current={mode === key ? "page" : undefined}
                className={tabsPillTriggerVariants()}
              >
                {label}
              </a>
            ))}
          </TabsPillList>
        }
        actions={<AccountMenu name="Sam Whitfield" email="sam@whitfield.family" avatar="assets/avatar-female-glasses.png" items={ACCOUNT_ITEMS} />}
      />
      {children}
    </div>
  )
}
