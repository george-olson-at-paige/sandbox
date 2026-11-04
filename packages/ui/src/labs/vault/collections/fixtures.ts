import type { Account, AccountType } from "./data"

/* @level 0. Passwords' words and one owner's accounts, for the labs stories. Words marked
   ⟨new⟩ aren't in the Vue page or its spec (pages/passwords/passwords.md) and need Product. */

export const ACCOUNT_TYPES: AccountType[] = [
  { id: "financial", label: "Financial account" },
  { id: "digital", label: "Digital account" },
  { id: "device", label: "Device" },
  { id: "utility", label: "Utility & home service" },
  { id: "loan", label: "Loan account" },
  { id: "subscription", label: "Subscription" },
  { id: "other", label: "Other" },
]
const type = (id: string) => ACCOUNT_TYPES.find((t) => t.id === id)!

export const PASSWORDS_COPY = {
  title: "Passwords, PINs and codes",
  lead: "The accounts your family will need to get into, and how.", // ⟨new⟩
  count: (n: number) => (n === 0 ? "None yet" : n === 1 ? "1 account" : `${n} accounts`), // ⟨new⟩
  add: "Add an account", // ⟨new⟩
  search: "Search accounts", // ⟨new⟩
  types: "Type",
  none: "No account matches that.", // ⟨new⟩
  clear: "Clear search and filters",
  emptyTitle: "No accounts yet", // ⟨new⟩
  emptyLine: "Start with the one your family would need first: a bank, a phone, an email.", // ⟨new⟩
  prompt: {
    title: (label: string) => `Next: a ${label.toLowerCase()}`, // ⟨new⟩
    line: (done: number, of: number) => `${done} of ${of} kinds covered`, // ⟨new⟩
    add: (label: string) => `Add a ${label.toLowerCase()}`,
    skip: "Skip",
  },
  back: "Passwords",
  edit: "Edit",
  more: (title: string) => `Actions for ${title}`, // ⟨new⟩
  remove: "Delete this account", // ⟨new⟩
  removeConfirm: (title: string) => ({
    title: `Delete “${title}”?`,
    description: "Its sign-in details and files go too. This can’t be undone.", // ⟨new⟩ (delete is hard: COLLECTIONS-PLAN §4.3)
    confirmLabel: "Delete it",
  }),
  added: "Added",
  signIn: "Signing in", // ⟨new⟩
  webSite: "Website",
  userName: "Username",
  password: "Password",
  notes: "Notes",
  files: "Files",
  who: "Only you can see this for now. Choosing who gets it comes later.", // ⟨new⟩ (sharing isn't built)
  copyUserName: (title: string) => `Copy the username for ${title}`,
  secretName: (label: string, title: string) => `the ${label.toLowerCase()} for ${title}`,
  form: {
    addTitle: "Add an account", // ⟨new⟩
    editTitle: (title: string) => `Edit ${title}`, // ⟨new⟩
    about: "The account", // ⟨new⟩
    type: "Type",
    typePlaceholder: "Choose a type",
    title: "Name",
    titleHint: "What your family would call it: “Chase checking”, “Mom’s iPad”.", // ⟨new⟩
    webSite: "Website",
    userName: "Username or email",
    signIn: "Signing in", // ⟨new⟩
    credentials: "Passwords, PINs and codes",
    credentialLabel: "What it is",
    credentialLabelPlaceholder: "Password, PIN, recovery code",
    secret: "Secret", // ⟨new⟩
    keep: "Leave blank to keep the one saved.", // ⟨new⟩
    credentialRow: (i: number) => `Credential ${i + 1}`,
    addCredential: "Add a password, PIN or code", // ⟨new⟩
    notes: "Notes",
    notesHint: "Anything that helps: security questions, where the device is.", // ⟨new⟩
    files: "Files",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    required: "Enter a value.",
  },
  file: {
    add: "Add a file",
    replace: "Replace the file",
    line: "Statements, recovery sheets, anything that helps", // ⟨new⟩
    tooMany: (max: number) => `Up to ${max} files.`,
    wrongKind: "That kind of file can’t go here.",
    remove: (name: string) => `Remove ${name}`,
    retry: (name: string) => `Try ${name} again`,
  },
}

export const ACCOUNTS: Account[] = [
  {
    id: "chase",
    title: "Chase checking",
    type: type("financial"),
    userName: "maya.reyes",
    webSite: "https://chase.com",
    notes: "Joint with David. The debit card PIN is the same as the phone’s.",
    added: "Added Oct 2, 2026",
    credentials: [
      { id: "c1", hasSecret: true },
      { id: "c2", label: "Debit card PIN", hasSecret: true },
    ],
    files: [{ id: "f1", name: "chase-statement-sep.pdf" }],
  },
  {
    id: "fidelity",
    title: "Fidelity 401(k)",
    type: type("financial"),
    userName: "mreyes1958",
    webSite: "https://fidelity.com",
    added: "Added Oct 2, 2026",
    credentials: [{ id: "c1", hasSecret: true }],
    files: [],
  },
  {
    id: "gmail",
    title: "Gmail",
    type: type("digital"),
    userName: "maya.reyes@gmail.com",
    webSite: "https://mail.google.com",
    added: "Added Sep 30, 2026",
    credentials: [
      { id: "c1", hasSecret: true },
      { id: "c2", label: "Recovery codes", hasSecret: true },
    ],
    files: [{ id: "f1", name: "google-backup-codes.pdf" }],
  },
  {
    id: "iphone",
    title: "Maya’s iPhone",
    type: type("device"),
    notes: "Face ID is set up for me only. The passcode works for anyone.",
    added: "Added Sep 30, 2026",
    credentials: [{ id: "c1", label: "Passcode", hasSecret: true }],
    files: [],
  },
  {
    id: "pge",
    title: "PGE electricity",
    type: type("utility"),
    userName: "maya.reyes",
    webSite: "https://portlandgeneral.com",
    added: "Added Sep 23, 2026",
    credentials: [{ id: "c1", hasSecret: true }],
    files: [],
  },
  {
    id: "netflix",
    title: "Netflix",
    type: type("subscription"),
    userName: "maya.reyes@gmail.com",
    webSite: "https://netflix.com",
    notes: "Cancel it.",
    added: "Added Sep 23, 2026",
    credentials: [{ id: "c1", hasSecret: false }],
    files: [],
  },
]

/** The secrets, asked for one at a time (SecretValue's `onReveal` in the stories). */
export const SECRETS: Record<string, string> = {
  "chase/c1": "Blue-heron-1958",
  "chase/c2": "4417",
  "fidelity/c1": "r3tire-W3ll!",
  "gmail/c1": "maya-gm-2026#",
  "gmail/c2": "8f2c 41aa 90de 77b1 5c3e e0f2",
  "iphone/c1": "271958",
  "pge/c1": "Lights0n-pdx",
}
