// An established account: someone who used Paige before Areas, so the Vault shows the Sections
// banner (R2-35, GAPS #22/#77). The prototype's established personas (src/seed/accounts.ts) aren't
// in this workspace, so this is Maya's home with the one flag that differs. /?as=established
import type { HomeView } from "./types"
import { home } from "./maya"

export const establishedHome: HomeView = { ...home, established: true }
