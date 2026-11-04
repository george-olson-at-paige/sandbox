/* @level 0 — sketch (LEVELS.md). VIEWS-PLAN.md §4: the people book and the documents the People
   and Documents Views' stories draw. Invented (Maya Reyes, the spike's persona), shaped like
   the webapp's PersonDetail / DocumentDetail. Each record is here for a state:
   - David: on several Areas, reachable, a Delegate. Elena, Tomás: minors, no reach needed.
   - Pepper: a pet (no Share, no owner section). Ellen Hart: no phone or email (the reach need).
   - Sam Ortiz: on nothing yet. Dr. Patel: one role, a phone.
   - Licence: values waiting. Insurance card: ready, shared. Will: made by Paige, a PDF.
   - Birth certificate: no file. IMG_2041: no type, no Area.
   VIEW_COPY is the Views' words, from the webapp's docs/views.md, word for word. */
import type { AreaId } from "../../../icons/area-glyphs"
import type { AreaRef, Person, VaultDocument } from "./data"

const AREA_LABELS: Record<AreaId, string> = {
  personal: "Personal",
  family: "Family",
  household: "Household",
  money: "Money",
  assets: "Assets & Property",
  health: "Health",
  insurance: "Insurance",
  estate: "Estate & Will",
  final: "Final Wishes",
}

export const area = (id: AreaId): AreaRef => ({ id, label: AREA_LABELS[id] })
const openIn = (id: AreaId) => ({
  href: `/area/${id}`,
  label: `Open in ${AREA_LABELS[id]}`,
})

/** The Views' words (docs/views.md). */
export const VIEW_COPY = {
  people: {
    title: "People",
    lead: "Everyone in your Vault, and what each of them does for you.",
    add: "Add someone",
    search: "Name, relation or email",
    pickTitle: "Pick someone",
    pickLead: "See what they do for you, the documents that name them, and what they can see.",
    pickEmpty: "When you add someone, this is where you’ll see what they do for you across your Vault.",
    roles: "Who they are to you",
    rolesPet: "What they’re part of",
    rolesEmpty: "Not named on anything yet.",
    canSee: "What they can see",
    canSeeEmpty: "Nothing yet — nothing in your Vault is shared with them.",
    addReach: "Add a phone or email",
    none: "Nobody matches that.",
  },
  documents: {
    title: "Documents",
    lead: "Everything you’ve put in your Vault, and what each one is for.",
    add: "Add a document",
    search: "Name or type",
    pickTitle: "Pick a document",
    pickLead: "See what it’s for, who it names, and who can see it.",
    pickEmpty: "When you add a document, this is where you’ll open it and see what it does across your Vault.",
    groupNeeds: "Needs you",
    groupReady: "Ready",
    ready: "Ready",
    forWhat: "What it’s for",
    read: "What we read from it",
    names: "Who it names",
    canSee: "Who can see it",
    canSeeEmpty: "Nobody yet — it isn’t shared with anyone.",
    useThis: "Use this",
    keepMine: "Keep mine",
    expand: "Expand",
    collapse: "Collapse",
    openFull: "Open full size",
    download: "Download",
    noFile: "Recorded by name only — there’s no file in your Vault yet.",
    none: "No document matches that.",
  },
  ownerOnly: "Only visible to you",
  startWith: "Start with these",
  share: "Share",
  more: "More actions",
  editDetails: "Edit details",
  done: "Done",
  filters: "Filters",
} as const

export const PEOPLE: Person[] = [
  {
    id: "david",
    name: "David Reyes",
    stated: "Spouse",
    initials: "DR",
    roles: "3 roles",
    areas: [area("family"), area("household"), area("estate")],
    needs: [],
    phone: "(206) 555-0192",
    email: "david.reyes@example.com",
    groups: [
      {
        area: area("family"),
        lines: [{ key: "ec", label: "An emergency contact", open: openIn("family") }],
      },
      {
        area: area("household"),
        lines: [
          {
            key: "keys",
            label: "Has a key",
            detail: "Front and side door",
            open: openIn("household"),
          },
        ],
      },
      {
        area: area("estate"),
        lines: [
          {
            key: "exec",
            label: "Executor",
            detail: "Named in your will",
            open: openIn("estate"),
          },
        ],
      },
    ],
    canSee: [
      {
        key: "delegate",
        label: "Your whole Vault, as your Delegate",
        detail: "Once they accept the invite",
      },
      { key: "ins", label: "Insurance card", detail: "Now · accepted" },
    ],
  },
  {
    id: "elena",
    name: "Elena Reyes",
    stated: "Child",
    aside: "9",
    initials: "ER",
    roles: "1 role",
    areas: [area("family")],
    needs: [],
    groups: [
      {
        area: area("family"),
        lines: [{ key: "dep", label: "Depends on you", open: openIn("family") }],
      },
    ],
    canSee: [],
  },
  {
    id: "tomas",
    name: "Tomás Reyes",
    stated: "Child",
    aside: "6",
    initials: "TR",
    roles: "1 role",
    areas: [area("family")],
    needs: [],
    groups: [
      {
        area: area("family"),
        lines: [{ key: "dep", label: "Depends on you", open: openIn("family") }],
      },
    ],
    canSee: [],
  },
  {
    id: "pepper",
    name: "Pepper",
    stated: "Pet",
    pet: true,
    aside: "Dog · Border collie",
    initials: "P",
    roles: "1 role",
    areas: [area("family")],
    needs: [],
    groups: [
      {
        area: area("family"),
        lines: [{ key: "dep", label: "Depends on you", open: openIn("family") }],
      },
    ],
    canSee: [],
  },
  {
    id: "patel",
    name: "Dr. Anita Patel",
    stated: "Physician",
    initials: "AP",
    roles: "1 role",
    areas: [area("health")],
    needs: [],
    phone: "(510) 555-0148",
    groups: [
      {
        area: area("health"),
        lines: [
          {
            key: "gp",
            label: "Primary doctor",
            detail: "Alder Street Family Practice",
            open: openIn("health"),
          },
        ],
      },
    ],
    canSee: [],
  },
  {
    id: "hart",
    name: "Rev. Ellen Hart",
    stated: "Clergy",
    initials: "EH",
    roles: "1 role",
    areas: [area("final")],
    needs: [{ kind: "reach", text: "No phone or email" }],
    groups: [
      {
        area: area("final"),
        lines: [{ key: "svc", label: "Leads the service", open: openIn("final") }],
      },
    ],
    canSee: [],
  },
  {
    id: "ortiz",
    name: "Sam Ortiz",
    stated: "Neighbor",
    initials: "SO",
    roles: "",
    areas: [],
    needs: [{ kind: "unnamed", text: "Not on anything yet" }],
    phone: "(206) 555-0177",
    groups: [],
    canSee: [],
  },
]

export const DOCUMENTS: VaultDocument[] = [
  {
    id: "licence",
    title: "Driver’s license",
    type: "ID",
    fileName: "DriverLicense.png",
    added: "Added Oct 2, 2026",
    file: { kind: "image", src: "/assets/fixture-docs/id-card.svg" },
    areas: [area("personal")],
    needs: [{ kind: "review", text: "2 values to check" }],
    facts: [{ label: "Original", value: "Wallet" }],
    forWhat: [
      {
        area: area("personal"),
        lines: [
          {
            key: "id",
            label: "A government photo ID",
            open: openIn("personal"),
          },
        ],
      },
    ],
    waiting: [
      {
        key: "dob",
        label: "Date of birth",
        value: "Mar 14, 1988",
        current: "Mar 14, 1958",
      },
      {
        key: "addr",
        label: "Home address",
        value: "1408 Ashcroft Lane, Portland, OR",
      },
    ],
    read: [
      {
        area: area("personal"),
        lines: [
          {
            key: "name",
            label: "Legal name",
            detail: "Maya Reyes",
            open: openIn("personal"),
          },
        ],
      },
    ],
    names: [],
    shares: [],
  },
  {
    id: "insurance",
    title: "Insurance card",
    type: "Insurance",
    fileName: "insurance-card.png",
    added: "Added Sep 23, 2026",
    file: { kind: "image", src: "/assets/fixture-docs/insurance-card.svg" },
    areas: [area("health"), area("insurance")],
    needs: [],
    facts: [],
    forWhat: [
      {
        area: area("health"),
        lines: [{ key: "plan", label: "Health insurance", open: openIn("health") }],
      },
      {
        area: area("insurance"),
        lines: [
          {
            key: "policy",
            label: "A health policy",
            open: openIn("insurance"),
          },
        ],
      },
    ],
    waiting: [],
    read: [],
    names: [{ id: "david", name: "David Reyes", href: "/people?id=david" }],
    shares: [{ id: "s1", who: "David Reyes", when: "Now · accepted", accepted: true }],
  },
  {
    id: "will",
    title: "Will",
    fileName: "Maya_Reyes_Last_Will.pdf",
    added: "Added Aug 11, 2026",
    generated: true,
    file: { kind: "image", src: "/assets/fixture-docs/will-page.svg" },
    areas: [area("estate")],
    needs: [],
    facts: [{ label: "Made by", value: "Paige, from what you told it" }],
    forWhat: [
      {
        area: area("estate"),
        lines: [{ key: "will", label: "The will", open: openIn("estate") }],
      },
    ],
    waiting: [],
    read: [],
    names: [
      { id: "david", name: "David Reyes", href: "/people?id=david" },
      { id: "elena", name: "Elena Reyes", href: "/people?id=elena" },
    ],
    shares: [],
  },
  {
    id: "birth",
    title: "Birth certificate",
    type: "Certificate",
    added: "Added Sep 23, 2026",
    areas: [area("family")],
    needs: [{ kind: "file", text: "No file yet" }],
    facts: [],
    forWhat: [
      {
        area: area("family"),
        lines: [
          {
            key: "bc",
            label: "Elena’s birth certificate",
            open: openIn("family"),
          },
        ],
      },
    ],
    waiting: [],
    read: [],
    names: [{ id: "elena", name: "Elena Reyes", href: "/people?id=elena" }],
    shares: [],
  },
  {
    id: "img2041",
    title: "IMG_2041",
    fileName: "IMG_2041.jpg",
    added: "Added Oct 30, 2026",
    file: { kind: "image", src: "/assets/fixture-docs/id-card.svg" },
    areas: [],
    needs: [{ kind: "type", text: "Say what it is" }],
    facts: [],
    forWhat: [],
    waiting: [],
    read: [],
    names: [],
    shares: [],
  },
]
