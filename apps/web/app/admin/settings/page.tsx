import { SettingsScreen } from "@/features/admin/settings-screen"

/* /admin/settings (R15-12): a stand-in settings page with one section so far, the global rev share
   defaults. The admin route map (GAPS #108) decides what else lives here. */
export default function AdminSettingsPage() {
  return <SettingsScreen />
}
