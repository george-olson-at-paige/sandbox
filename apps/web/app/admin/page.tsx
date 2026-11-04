import { PulseScreen } from "@/features/admin/pulse-screen"
import { pulse } from "@paige/ui/fixtures/admin"

/* /admin (R8-11): the admin proof as an app route, the same composition as the Admin › Pulse
   story. It is here so the Next build can show the bundle rule: Recharts is in this route's lazy
   chunk only, never in /, /area/* or /setup/*. */
export default function AdminPulsePage() {
  return <PulseScreen pulse={pulse} />
}
