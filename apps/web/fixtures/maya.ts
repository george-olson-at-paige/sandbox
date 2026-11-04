// Persona 3 · "Completed · two documents read" — Maya Elena Reyes
// (prototype src/seed/accounts.ts:70-112). Values copied from the prototype's
// derived views for this account (Home evaluation, Family / Personal / Household
// area views); nothing here is computed.
import type { AreaView, HomeView, SetupView } from "./types"

export const home: HomeView = {
  owner: { name: "Maya Elena Reyes", email: "maya@example.com", avatar: "/assets/avatar-female-glasses.png" },
  hero: {
    eyebrow: "Vault",
    title: "Next: tell us who the insurance is for.",
    body: "You gave us your licence and a health card, so Personal and Insurance already have a start. We’ll need to add the name of the person or people the policy pays out to.",
    cta: { label: "Add a beneficiary", href: "/area/insurance" },
  },
  tiles: [
    { area: "personal", name: "Personal", line: "The people helping out will be able to prove who you are.", state: "set-up", firstStep: "Start with a photo of your driver’s licence", meta: { strong: "Set up", rest: "8 items saved" }, ratio: 1 },
    { area: "family", name: "Family", line: "Whoever steps in will know who depends on you, and who promised to help.", state: "in-progress", firstStep: "Start with the people who live with you", meta: { strong: "4 saved", rest: "next: a guardian for Elena" }, ratio: 0.6 },
    { area: "household", name: "Household", line: "Whoever keeps the house running can pick up where you left off.", state: "not-started", firstStep: "Start with the people you’d call in a pinch", ratio: 0 },
    { area: "money", name: "Money", line: "The person paying your bills can see what’s coming in and going out.", state: "not-started", firstStep: "Start with the account your bills come out of", ratio: 0 },
    { area: "assets", name: "Assets & Property", line: "Whoever inherits something will be able to find it.", state: "in-progress", firstStep: "Start with where you live", meta: { strong: "1 saved", rest: "next: who the mortgage is with" }, ratio: 0.2 },
    { area: "health", name: "Health", line: "Whoever speaks for you will know what you would have said.", state: "in-progress", firstStep: "Start with the medications you take", meta: { strong: "8 saved", rest: "next: your pharmacy" }, ratio: 0.2 },
    { area: "insurance", name: "Insurance", line: "The person filing a claim will have the policy in front of them.", state: "in-progress", firstStep: "Start with a photo of an insurance card", meta: { strong: "10 saved", rest: "next: home or renters insurance" }, ratio: 0.6 },
    { area: "estate", name: "Estate & Will", line: "Your executor will have what they need after you’ve passed.", state: "in-progress", firstStep: "Start with who you’d name as executor", meta: { strong: "1 saved", rest: "next: a will, which you don’t have yet" }, ratio: 0.25 },
    { area: "final", name: "Final Wishes", line: "Your family will know what you would have wanted.", state: "not-started", firstStep: "Start with burial or cremation", ratio: 0 },
  ],
  browseNote: "Everything is still here, sorted the way you’re used to.",
}

const LIC = "your driver’s licence"
const linkOut = { documents: "/section/documents", contacts: "/section/contacts" }
export { linkOut }

export const areas: Record<string, AreaView> = {
  family: {
    area: "family",
    name: "Family",
    line: "Whoever steps in will know who depends on you, and who promised to help.",
    count: "4 records",
    lead: "If someone had to step in tomorrow, this is where they’d find out who depends on you.",
    setUp: false,
    essentials: [
      {
        key: "family.dependents", label: "The people who depend on you", why: "Whoever steps in needs to know who to look after first.", status: "present",
        actions: [{ label: "Add another", kind: "add" }],
        people: [
          { name: "David Reyes", detail: "Spouse · (206) 555-0192", tags: ["Emergency contact"] },
          { name: "Elena Reyes", detail: "Child · 9 · No details needed", inline: ["Name a guardian"] },
          { name: "Tomás Reyes", detail: "Child · 6 · No details needed", inline: ["Name a guardian"] },
          { name: "Pepper", detail: "Pet · 4 · Dog · No details needed", pet: true },
        ],
      },
      { key: "family.contact_method", label: "A way to reach each of them", why: "A number or email saves whoever steps in from having to go looking.", status: "present", actions: [] },
      {
        key: "family.guardianship", label: "Who would look after any children", why: "If you couldn’t look after them, this is who would.", status: "open",
        actions: [{ label: "Name someone", kind: "add" }, { label: "Nobody under 18 depends on me", kind: "decline" }],
      },
      {
        key: "family.emergency", label: "An emergency contact", why: "This is the first person who gets called.", status: "present", actions: [],
        people: [{ name: "David Reyes", detail: "Spouse · (206) 555-0192", tags: ["Emergency contact"] }],
      },
      {
        key: "family.documents", label: "A document for the family", why: "Birth certificates, custody orders, and school and medical forms prove who a child is and who may act for them.", status: "open",
        actions: [{ label: "Add the document", kind: "add" }, { label: "Nothing to file yet", kind: "decline" }],
      },
    ],
    depth: [
      { key: "family.others", label: "Family and friends who’d help", why: "The parents, siblings, and friends who said “call me”.", status: "open", actions: [{ label: "Name them", kind: "add" }] },
    ],
    rail: [
      {
        id: "whats-left", title: "What’s left", variant: "muted",
        rows: [
          { kind: "status", status: "open", label: "Who would look after any children", href: "#item-family-guardianship" },
          { kind: "status", status: "open", label: "A document for the family", href: "#item-family-documents" },
        ],
      },
      {
        id: "people", title: "Who you’re protecting", count: "4",
        rows: [
          { kind: "person", name: "David Reyes", detail: "The people who depend on you · Emergency contact", reach: { label: "(206) 555-0192", href: "tel:(206) 555-0192" } },
          { kind: "person", name: "Elena Reyes", detail: "The people who depend on you", note: "No details needed" },
          { kind: "person", name: "Tomás Reyes", detail: "The people who depend on you", note: "No details needed" },
          { kind: "person", name: "Pepper", detail: "The people who depend on you", note: "No details needed", pet: true },
        ],
      },
      {
        id: "cross", title: "Guardianship and the will",
        description: "A guardian named here is also what the will has to say. Estate & Will shows whether the will is on file.",
        links: [{ label: "Estate & Will", href: "/area/estate", area: "estate" }],
      },
    ],
  },

  personal: {
    area: "personal",
    name: "Personal",
    line: "The people helping out will be able to prove who you are.",
    count: "1 record",
    lead: "If someone had to prove who you are, this is the page they’d open.",
    setUp: true,
    review: { title: "Three details read from your driver’s licence.", body: "Have a look and correct anything we got wrong. They stay tagged until you do." },
    essentials: [
      {
        key: "personal.legal_name", label: "Your legal name", why: "Everything your loved ones settle will be under this name.", status: "present", actions: [],
        fields: [
          { key: "legalName", label: "Full legal name", state: { kind: "ordinary", value: "Maya Elena Reyes", source: `Read from ${LIC}, confirmed by you` } },
          { key: "preferredName", label: "What you go by", state: { kind: "ordinary", value: "Maya" } },
        ],
      },
      {
        key: "personal.dob", label: "Date of birth", why: "Nearly every form your family fills in will ask for it.", status: "present", actions: [],
        fields: [
          { key: "dob", label: "Date of birth", state: { kind: "autofilled", value: "11 August 1979", source: `From ${LIC}, 13 Sep`, confirmedSource: `Read from ${LIC}, confirmed by you` } },
        ],
      },
      {
        key: "personal.residence", label: "Where you live", why: "This is where the post arrives and where the estate is settled.", status: "present", actions: [],
        fields: [
          {
            key: "address", label: "Home address", wide: true,
            state: {
              kind: "conflict", preselected: "document",
              options: [
                { id: "document", value: "1408 Ashcroft Lane, Portland OR 97214", source: `From ${LIC}, 13 Sep` },
                { id: "typed", value: "1408 Ashcroft Ln, Apt 2, Portland OR 97214", source: "What you typed, 13 Sep" },
              ],
            },
          },
        ],
      },
      {
        key: "personal.photo_id", label: "A government photo ID", why: "Proof of who you are, for the moment someone has to show it.", status: "present", actions: [],
        docs: [{ name: "drivers-licence-front.jpg", detail: "Passport or driver’s licence · uploaded 13 Sep", tag: { label: "Partly read · 5 read, 1 unreadable", tone: "info" } }],
        fields: [
          { key: "licenceNumber", label: "Licence number", state: { kind: "autofilled", value: "C-4471-9982-11", source: `From ${LIC}, 13 Sep`, confirmedSource: `Read from ${LIC}, confirmed by you` } },
          { key: "licenceExpiry", label: "Licence expires", state: { kind: "autofilled", value: "11 August 2029", source: `From ${LIC}, 13 Sep`, confirmedSource: `Read from ${LIC}, confirmed by you` } },
          { key: "issuingState", label: "Issuing state", state: { kind: "notFound", expected: true, reason: "We expected this on your licence, but that corner of the scan was too dark to read. Try another photo, or type it in.", addLabel: "Add the state" } },
        ],
      },
      {
        key: "personal.reach_you", label: "A way to reach you", why: "The people helping can check details with you.", status: "present", actions: [],
        fields: [
          { key: "mobile", label: "Mobile", state: { kind: "ordinary", value: "(206) 555-0192" } },
          { key: "email", label: "Email", state: { kind: "notFound", expected: false, reason: "This isn’t on a driver’s licence, so we’ll ask you to fill it in.", addLabel: "Add an address" } },
        ],
      },
      { key: "personal.employer", label: "Employer or HR contact", why: "Your family will need to know who to tell, and who handles what you’re owed.", status: "open", actions: [{ label: "Add", kind: "add" }] },
    ],
    depth: [],
    rail: [
      { id: "provenance", title: "How this got filled in", description: "You uploaded one photo during setup. Paige read what it could, left the rest blank, and tagged everything it read so you can tell its work from yours." },
      {
        id: "documents", title: "Documents here", count: "1", more: { label: "Open in Documents", href: "/section/documents" },
        rows: [{ kind: "document", name: "drivers-licence-front.jpg", detail: "Passport or driver’s licence · uploaded 13 Sep", tag: { label: "Partly read · 5 read, 1 unreadable", tone: "info" }, href: "/section/documents" }],
      },
    ],
  },

  insurance: {
    area: "insurance",
    name: "Insurance",
    line: "The person filing a claim will have the policy in front of them.",
    count: "5 records",
    lead: "If someone had to file a claim next month, this is the page they’d open.",
    setUp: false,
    review: { title: "Three details read from your health insurance card.", body: "Have a look and correct anything we got wrong. They stay tagged until you do." },
    essentials: [
      // Host row: the Sweep body (per-kind Recorded / Open / Answered lines, policy records) is a feature component not built in this spike.
      { key: "insurance.sweep", label: "Which kinds you have: life, health, home or renters, and auto", why: "Listing every policy means your family won’t miss one.", status: "open", actions: [] },
      { key: "insurance.carrier_number", label: "Carrier and policy number on every policy", why: "With the number, your family can file a claim straight away.", status: "present", actions: [] },
      {
        key: "insurance.claim_contact", label: "A claim contact on every policy", why: "Whoever files the claim will know exactly who to call.", status: "partial", partialLabel: "On file · details not captured",
        actions: [{ label: "Add the details", kind: "add" }],
        docs: [{ name: "Term life policy - Banner Life.pdf", detail: "Life insurance policy · uploaded 13 Sep · 22 pages", tag: { label: "Saved · not read yet", tone: "warning" } }],
      },
      { key: "insurance.beneficiary", label: "Who each policy pays out to", why: "The policy exists for whoever is named here.", status: "open", actions: [{ label: "Go to the policies", kind: "add" }] },
      { key: "insurance.policy_docs", label: "The document behind each policy", why: "A claim gets filed from the policy itself, so each document is attached to the policy it belongs to.", status: "present", actions: [] },
    ],
    depth: [
      { key: "insurance.agent", label: "Agent or broker", why: "This is the person who knows your coverage.", status: "open", actions: [{ label: "Add", kind: "add" }] },
    ],
    rail: [
      {
        id: "whats-left", title: "What’s left", variant: "muted",
        rows: [
          { kind: "status", status: "open", label: "Which kinds you have: life, health, home or renters, and auto", href: "#item-insurance-sweep" },
          { kind: "status", status: "partial", label: "A claim contact on every policy", detail: "On file · details not captured", href: "#item-insurance-claim_contact" },
          { kind: "status", status: "open", label: "Who each policy pays out to", href: "#item-insurance-beneficiary" },
        ],
      },
      { id: "provenance", title: "How this got filled in", description: "You uploaded two photos during setup. Paige read what it could, left the rest blank, and tagged everything it read so you can tell its work from yours." },
      {
        id: "documents", title: "Documents here", count: "3", more: { label: "Open in Documents", href: "/section/documents" },
        rows: [
          { kind: "document", name: "health-card-front.jpg", detail: "Health insurance card · uploaded 13 Sep", tag: { label: "Read · 4 details", tone: "success" }, href: "/section/documents" },
          { kind: "document", name: "health-card-back.jpg", detail: "Health insurance card · uploaded 13 Sep", tag: { label: "Read · 2 details", tone: "success" }, href: "/section/documents" },
          { kind: "document", name: "Term life policy - Banner Life.pdf", detail: "Life insurance policy · uploaded 13 Sep · 22 pages", tag: { label: "Saved · not read yet", tone: "warning" }, href: "/section/documents" },
        ],
      },
    ],
  },

  household: {
    area: "household",
    name: "Household",
    line: "Whoever keeps the house running can pick up where you left off.",
    count: "Nothing saved yet",
    lead: "If someone had to keep the house running for a month, this is the page they’d open.",
    setUp: false,
    essentials: [
      { key: "household.keyholder", label: "Who has a key", why: "This is the first call anybody makes.", status: "open", first: true, actions: [{ label: "Name someone", kind: "first" }] },
      { key: "household.runs_it", label: "The people who keep it running", why: "Whoever steps in will know who the cleaner, the carer, and the vet are.", status: "open", actions: [{ label: "Name them", kind: "add" }, { label: "Nobody but us", kind: "decline" }] },
      { key: "household.keys_papers", label: "Where the keys and papers are", why: "A couple of sentences here can save your family a week of searching.", status: "open", actions: [{ label: "Add it", kind: "add" }] },
      { key: "household.documents", label: "A household document", why: "Utility bills, service agreements, and care instructions keep the house running for whoever takes it on.", status: "open", actions: [{ label: "Add the document", kind: "add" }, { label: "Nothing to file yet", kind: "decline" }] },
    ],
    depth: [],
    rail: [],
  },
}

export const setup: SetupView = {
  totalSteps: 7,
  roles: [
    { key: "parent", label: "A parent", sub: "Guardianship, school, and medical details for the people who depend on you", opens: ["family"] },
    { key: "partner", label: "A partner or spouse", sub: "Joint accounts, survivor benefits, and who your policies pay out to", opens: ["family", "insurance"] },
    { key: "caring-parent", label: "Caring for a parent", sub: "Their medications, doctors, and paperwork", opens: ["family", "health"] },
    { key: "homeowner", label: "A homeowner", sub: "The deed, mortgage, insurance, and other services", opens: ["assets", "household"] },
    { key: "business-owner", label: "A business owner", sub: "Partners, succession, and essential documents", opens: [] },
    { key: "on-my-own", label: "On my own", sub: "Nobody depends on me financially", opens: ["personal"] },
  ],
  selectedRoles: ["parent", "partner", "homeowner"],
  about: {
    legalName: "Maya Elena Reyes",
    preferredName: "Maya",
    mobile: "+12065550192",
    address: "1408 Ashcroft Ln, Apt 2, Portland OR 97214",
    ownOrRent: "own",
  },
}
