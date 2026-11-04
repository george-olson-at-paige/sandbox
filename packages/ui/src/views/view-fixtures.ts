import type { VaultDocument } from "./documents-view"
import type { Login } from "./passwords-view"
import type { ModeEntry } from "./mode-board"
import type { Person } from "./people-view"

/* Story-only fixtures for the views: the Whitfield household. Not exported from the package. */

export const people: Person[] = [
  { id: "alex", name: "Alex Rivera", relation: "Friend", phone: "(503) 555-0101", roles: [{ area: "family", title: "Emergency contact" }], namedIn: [], canSee: [] },
  { id: "casey", name: "Casey Nguyen", relation: "Coworker", email: "casey@northwind.co", roles: [], namedIn: [], canSee: [] },
  { id: "dana", name: "Dana Ortiz", relation: "Insurance agent", email: "dana@ortizagency.com", roles: [{ area: "insurance", title: "Your agent", detail: "Home and auto" }], namedIn: [], canSee: ["Home insurance policy"] },
  {
    id: "jordan",
    name: "Jordan Whitfield",
    relation: "Spouse / Partner",
    phone: "(503) 555-0142",
    roles: [
      { area: "family", title: "The people who depend on you" },
      { area: "household", title: "Who has a key" },
    ],
    namedIn: [{ area: "insurance", title: "MetLife", detail: "Beneficiary · Life insurance" }],
    canSee: [],
  },
  { id: "lila", name: "Lila Whitfield", relation: "Child", roles: [{ area: "family", title: "The people who depend on you" }], namedIn: [], canSee: [] },
  { id: "morgan", name: "Morgan Blake", relation: "Friend", roles: [{ area: "estate", title: "Backup executor" }], namedIn: [], canSee: [] },
  { id: "pepper", name: "Pepper", relation: "Pet", roles: [{ area: "family", title: "Pets in your care" }], namedIn: [], canSee: [] },
]

export const documents: VaultDocument[] = [
  { id: "scan", name: "Scan 0042", added: "Sep 21, 2026", hasFile: true, uses: [], reads: [], sharedWith: [] },
  { id: "deed", name: "House deed", kind: "Deed or lease", added: "Aug 2, 2026", hasFile: false, uses: [{ area: "assets", title: "Your home" }], reads: [], sharedWith: [] },
  { id: "will", name: "Last will and testament", kind: "Will", added: "Jun 30, 2026", original: "Safe deposit box", hasFile: true, uses: [{ area: "estate", title: "Your will" }], reads: [], sharedWith: ["Jordan Whitfield"] },
  {
    id: "health",
    name: "Health insurance card",
    kind: "Insurance card",
    added: "May 14, 2026",
    original: "Wallet",
    hasFile: true,
    uses: [
      { area: "health", title: "Your health plan" },
      { area: "insurance", title: "Health insurance" },
    ],
    reads: [{ area: "insurance", fact: "Member ID", label: "Member ID", value: "XKZ 4482 1190" }],
    sharedWith: [],
  },
  {
    id: "license",
    name: "Driver's license",
    kind: "Driver's license",
    added: "Apr 3, 2026",
    original: "Wallet",
    hasFile: true,
    uses: [{ area: "personal", title: "A government photo ID" }],
    reads: [{ area: "personal", fact: "Your legal name", label: "Full legal name", value: "Sam Whitfield", unchecked: true }],
    sharedWith: [],
  },
  { id: "tax", name: "2025 tax return", kind: "Tax return or tax form", added: "Apr 12, 2026", hasFile: true, uses: [{ area: "money", title: "Taxes" }], reads: [], sharedWith: [] },
]

export const logins: Login[] = [
  { id: "chase", service: "Chase", url: "chase.com", username: "sam.whitfield", password: "Harbor-lantern-42!", area: "money", updated: "Mar 2, 2026", releaseTo: ["Jordan Whitfield"] },
  { id: "fidelity", service: "Fidelity", url: "fidelity.com", username: "swhitfield", password: "fid2019", area: "money", updated: "Nov 18, 2019", releaseTo: [], weak: true },
  { id: "metlife", service: "MetLife", url: "metlife.com", username: "sam@whitfield.family", password: "Quiet-otter-meadow-7", area: "insurance", updated: "Jan 9, 2026", releaseTo: ["Jordan Whitfield"] },
  { id: "pge", service: "PGE", url: "portlandgeneral.com", username: "whitfield.home", password: "Copper-kettle-19", area: "household", updated: "Feb 21, 2026", releaseTo: [] },
  { id: "google", service: "Google", url: "accounts.google.com", username: "sam@whitfield.family", password: "Velvet-signal-tide-88", area: "personal", updated: "Aug 14, 2026", releaseTo: ["Jordan Whitfield", "Morgan Blake"], note: "2-step codes go to Sam's phone. Backup codes are in the safe." },
]

export const messages: ModeEntry[] = [
  { id: "wedding", tag: "Personal letter", when: "Scheduled for Sep 20, 2026", title: "For your wedding day", body: "Whatever happens, know that I'm so proud of the person you've become and the life you're building.", to: ["Lila Whitfield"], attachments: ["family-photo.jpg"] },
  { id: "thirty", tag: "Birthday", when: "Sent Feb 11, 2026", title: "Happy 30th birthday", body: "Thirty looks good on you. Go celebrate, you earned it.", to: ["Alex Rivera"], attachments: [] },
  { id: "advice", tag: "Advice", when: "Delivered after I'm gone", title: "A few things I never got to say", body: "Take care of your brother. Trust your own judgment, you have good instincts.", to: ["Lila Whitfield"], attachments: ["letter-scan.pdf", "voicemail.mp3"] },
]

export const memories: ModeEntry[] = [
  { id: "lake", tag: "Story", when: "Jun 14, 2026", title: "Our trip to the lake", body: "A quiet weekend away, just the two of us. We met at the dock, both waiting out the rain.", to: ["Jordan Whitfield"], attachments: ["dock.jpg"] },
  { id: "grandma", tag: "Birthday", when: "Mar 2, 2019", title: "Grandma's 80th birthday", body: "Four generations around one table, and she still won at cards.", to: [], attachments: ["toast.mp4"] },
  { id: "reunion", tag: "Story", when: "Jul 4, 2019", title: "Family reunion cookout", body: "Uncle Ray's brisket, the water balloon war, and fireworks over the river.", to: [], attachments: [] },
]
