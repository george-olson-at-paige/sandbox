/* @level 0 — sketch (LEVELS.md). The action icons (REVIEW-14 R14-03, the slice Item needs): one
   icon per action, so the same action always has the same icon. A caller names the action; it
   never picks a glyph. R14-03's full inventory (every role: menus, navigation, heroes, status)
   is still open; this is its "named icon per common action" part.
   - In use today: edit (InlineEdit, Avatar's edit badge), remove (× on a list, ADR 0076 rule 6),
     reveal and hide (PasswordField, SsnField).
   - Coming: copy (an account's credentials), download (a document).
   - Not here: delete. Rule 6 sends deletion through ×'s dialog ("Delete {name} from People"),
     so a trash icon beside × would be a second removal icon. */
import { CopyIcon, DownloadIcon, EyeIcon, EyeOffIcon, PencilIcon, XIcon, type LucideIcon } from "lucide-react"

/** Each action and its icon. Add an action here, never a glyph at a call site. */
export const ACTION_ICONS = {
  edit: PencilIcon,
  remove: XIcon,
  reveal: EyeIcon,
  hide: EyeOffIcon,
  copy: CopyIcon,
  download: DownloadIcon,
} as const satisfies Record<string, LucideIcon>

/** An action that has an icon. */
export type ActionIcon = keyof typeof ACTION_ICONS
