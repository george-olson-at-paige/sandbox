import type { RichTextValue } from "../../../components/inputs/rich-text"
import type { DeliveryKind, DeliveryRule, Message, MessageStatus, MessageType } from "./messages"

/* @level 0. Messages' words and one owner's letters, for the labs stories. Words marked ⟨new⟩
   aren't in the Vue page or its spec (pages/messages/messages.md) and need Product. The types
   are stand-ins for the API's enabled catalog (`GET messages/types`). */

export const MESSAGE_TYPES: MessageType[] = [
  { id: "letter", label: "Personal letter" },
  { id: "birthday", label: "Birthday" },
  { id: "milestone", label: "Milestone" },
  { id: "instructions", label: "Instructions" },
]
const type = (id: string) => MESSAGE_TYPES.find((t) => t.id === id)!

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export const MESSAGES_COPY = {
  title: "Messages",
  lead: "Letters you write now, for the people you love to read later.", // ⟨new⟩
  count: (n: number) => (n === 0 ? "None yet" : n === 1 ? "1 message" : `${n} messages`), // ⟨new⟩
  add: "Write a message", // ⟨new⟩
  search: "Search messages", // ⟨new⟩
  types: "Type",
  none: "No message matches that.", // ⟨new⟩
  clear: "Clear search and filters",
  emptyTitle: "No messages yet", // ⟨new⟩
  emptyLine: "Start with the one you’d most regret not writing.", // ⟨new⟩
  /** The list's groups, by when they go, in this order. */
  groups: { now: "Right away", date: "On a date", yearly: "Every year", delegate: "When a delegate says", after: "After I’m gone" } satisfies Record<
    DeliveryKind,
    string
  >, // ⟨new⟩
  status: { draft: "Draft", scheduled: "Ready", sent: "Sent" } satisfies Record<MessageStatus, string>, // ⟨new⟩ ("Scheduled" on the wire)
  /** One line for when it goes. */
  rule: (r: DeliveryRule) =>
    r.kind === "now"
      ? "Goes right away"
      : r.kind === "date"
        ? `Goes on ${new Date(`${r.date}T12:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
        : r.kind === "yearly"
          ? `Goes every year on ${MONTHS[r.month - 1]} ${r.day}`
          : r.kind === "delegate"
            ? "Goes when a delegate says"
            : "Goes after I’m gone", // ⟨new⟩
  notYet: "Paige doesn’t send messages yet. This is what you’ve asked for, kept for when it does.", // ⟨new⟩ (D2)
  back: "Messages",
  edit: "Edit",
  more: (subject: string) => `Actions for ${subject}`, // ⟨new⟩
  remove: "Delete this message", // ⟨new⟩
  removeConfirm: (subject: string) => ({
    title: `Delete “${subject}”?`,
    description: "The letter and its files go with it.", // ⟨new⟩
    confirmLabel: "Delete it",
  }),
  letter: "The letter", // ⟨new⟩
  files: "Files",
  form: {
    addTitle: "Write a message", // ⟨new⟩
    editTitle: (subject: string) => `Edit ${subject}`, // ⟨new⟩
    about: "The message", // ⟨new⟩
    type: "Type",
    typePlaceholder: "Choose a type",
    subject: "Subject",
    subjectHint: "What they’ll see first: “For your wedding day”.", // ⟨new⟩
    letter: "The letter", // ⟨new⟩
    letterPlaceholder: "Dear …", // ⟨new⟩
    when: "When it goes", // ⟨new⟩
    whenHint: "Paige doesn’t send messages yet; this is kept for when it does.", // ⟨new⟩
    rule: {
      label: "When it goes",
      kinds: [
        { kind: "now", label: "Right away", hint: "As soon as sending starts" },
        { kind: "date", label: "On a date", hint: "Once, on the day you pick" },
        { kind: "yearly", label: "Every year", hint: "On a month and day, each year" },
        { kind: "delegate", label: "When a delegate says", hint: "Your delegate decides the moment" },
        { kind: "after", label: "After I’m gone", hint: "Once your passing is recorded" },
      ] satisfies Array<{ kind: DeliveryKind; label: string; hint: string }>,
      date: "The date",
      month: "Month",
      day: "Day",
      months: MONTHS,
    },
    files: "Files",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    required: "Enter a value.",
  },
  file: {
    add: "Add a file",
    replace: "Replace the file",
    line: "Up to 2 files", // ⟨new⟩
    full: "That’s 2 files, the most a message takes.", // ⟨new⟩
    tooMany: (max: number) => `Up to ${max} files.`,
    wrongKind: "That kind of file can’t go here.",
    remove: (name: string) => `Remove ${name}`,
    retry: (name: string) => `Try ${name} again`,
  },
}

const doc = (...paragraphs: string[]): RichTextValue => ({
  type: "doc",
  content: paragraphs.map((text) => ({ type: "paragraph", content: [{ type: "text", text }] })),
})

export const MESSAGES: Message[] = [
  {
    id: "elena-wedding",
    subject: "For your wedding day",
    type: type("milestone"),
    body: doc(
      "Mija, if you’re reading this, it’s your wedding day and I’m not there to fix your veil.",
      "Your grandmother told me one thing the morning I married your father: laugh first. I’m passing it on.",
    ),
    rule: { kind: "delegate" },
    status: "scheduled",
    written: "Written Oct 2, 2026",
    files: [{ id: "f1", name: "grandmas-veil.jpg" }],
  },
  {
    id: "tomas-birthday",
    subject: "Happy birthday, Tomás",
    type: type("birthday"),
    body: doc("Every year on your birthday you’ll get one of these. This year’s is about the canoe."),
    rule: { kind: "yearly", month: 9, day: 12 },
    status: "scheduled",
    written: "Written Sep 30, 2026",
    files: [],
  },
  {
    id: "david",
    subject: "To David",
    type: type("letter"),
    body: doc("Thirty-nine years. I wrote this one slowly.", "The house is yours to keep or sell. Don’t keep it for me."),
    rule: { kind: "after" },
    status: "scheduled",
    written: "Written Sep 23, 2026",
    files: [],
  },
  {
    id: "practical",
    subject: "The practical things",
    type: type("instructions"),
    body: doc("Start with the binder in the hall closet. The passwords are in Paige."),
    rule: { kind: "after" },
    status: "draft",
    written: "Written Sep 23, 2026",
    files: [
      { id: "f1", name: "binder-index.pdf" },
      { id: "f2", name: "safe-deposit-box.pdf" },
    ],
  },
  {
    id: "elena-18",
    subject: "When you turn 18",
    type: type("milestone"),
    body: doc("You’re an adult today, which means you get the real recipe."),
    rule: { kind: "date", date: "2026-03-02" },
    status: "sent",
    written: "Written Mar 1, 2024",
    files: [],
  },
]
