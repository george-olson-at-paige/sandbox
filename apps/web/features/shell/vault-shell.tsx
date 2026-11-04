import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { LogOutIcon, SettingsIcon } from "lucide-react"

import { tabsPillTriggerVariants } from "@paige/ui/components/navigation/tabs-pill-styles"
import { TabsPillList } from "@paige/ui/components/navigation/tabs-pill"
import { AccountMenu } from "@paige/ui/shell/account-menu"
import { AppHeader } from "@paige/ui/shell/app-header"


type Mode = "vault" | "messages" | "memories"
const MODES: Array<[Mode, string, string]> = [
  ["vault", "Vault", "/"],
  ["messages", "Messages", "/mode/messages"],
  ["memories", "Memories", "/mode/memories"],
]

export function PaigeLogo() {
  return (
    <Link href="/" aria-label="Paige home" className="rounded-sm focus-ring">
      <Image src="/assets/paige-logo.png" alt="Paige" width={55} height={24} priority className="h-6 w-auto" />
    </Link>
  )
}

/** The Vault nav (transitional variant): logo, the three-mode pill, utilities, avatar.
    Children are a page template (HomePage, AreaPage), which owns the <main> and its frame. */
// The prototype has no account menu: these two items are stand-ins (GAPS #74).
const ACCOUNT_ITEMS = [
  { label: "Settings", href: "/section/settings", icon: <SettingsIcon /> },
  { label: "Sign out", href: "/sign-out", icon: <LogOutIcon /> },
]

export function VaultShell({
  mode = "vault",
  frame,
  owner,
  children,
}: {
  mode?: Mode
  /** workspace: over a WorkspacePage (People, Documents), the header on the workspace's edge. */
  frame?: "page" | "workspace"
  owner: { name: string; email?: string; avatar: string }
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        frame={frame}
        logo={<PaigeLogo />}
        nav={
          <TabsPillList aria-label="Modes">
            {MODES.map(([key, label, href]) => (
              <Link key={key} href={href} aria-current={mode === key ? "page" : undefined} className={tabsPillTriggerVariants()}>
                {label}
              </Link>
            ))}
          </TabsPillList>
        }
        // Search and notifications aren't built, so HeaderSearch and NotificationBell are left
        // out until they are (R2-30, absent beats broken). Both need href or onOpen to compile.
        actions={<AccountMenu name={owner.name} email={owner.email} avatar={owner.avatar} items={ACCOUNT_ITEMS} linkAs={Link} />}
      />
      {children}
    </div>
  )
}
