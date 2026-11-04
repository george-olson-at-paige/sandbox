"use client"


import { RevShareDefaultsSection } from "@paige/ui/admin/rev-share"

import { revShareDefaults, saveRevShareDefaults } from "@paige/ui/fixtures/partners"

import { AdminScreen } from "./admin-screen"

/* /admin/settings (R15-12): the global rev share defaults, the same parameter form as a partner's
   override. Saving says, in place, how many partners use the defaults and that overrides are
   untouched. Fixtures only. */
export function SettingsScreen() {
  return (
    <AdminScreen
      current="settings"
      title="Settings"
      description="Settings that apply across the admin site."
    >
      <RevShareDefaultsSection defaults={revShareDefaults} onSave={saveRevShareDefaults} />
    </AdminScreen>
  )
}
