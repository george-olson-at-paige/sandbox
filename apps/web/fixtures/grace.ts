// Persona 6 · "Mature · mostly complete" — Grace Lindqvist (prototype
// src/seed/accounts.ts:265-346). Only her Family page, because Maya has no
// declined row anywhere (/area/family?as=grace).
import type { AreaView } from "./types"

export const graceFamily: AreaView = {
  area: "family",
  name: "Family",
  line: "Whoever steps in will know who depends on you, and who promised to help.",
  count: "5 records",
  lead: "If someone had to step in tomorrow, this is where they’d find out who depends on you.",
  setUp: true,
  essentials: [
    {
      key: "family.dependents", label: "The people who depend on you", why: "Whoever steps in needs to know who to look after first.", status: "present",
      actions: [{ label: "Add another", kind: "add" }],
      people: [
        { name: "Daniel Lindqvist", detail: "Spouse · (503) 555-0202", tags: ["Emergency contact"] },
        { name: "Anna Lindqvist", detail: "Child · 31 · (206) 555-0210" },
        { name: "Erik Lindqvist", detail: "Child · 28 · (503) 555-0211" },
      ],
    },
    { key: "family.contact_method", label: "A way to reach each of them", why: "A number or email saves whoever steps in from having to go looking.", status: "present", actions: [] },
    { key: "family.guardianship", label: "Who would look after any children", why: "If you couldn’t look after them, this is who would.", status: "declined", declinedLabel: "Nobody under 18 depends on me", actions: [{ label: "Change", kind: "change" }] },
    {
      key: "family.emergency", label: "An emergency contact", why: "This is the first person who gets called.", status: "present", actions: [],
      people: [{ name: "Daniel Lindqvist", detail: "Spouse · (503) 555-0202", tags: ["Emergency contact"] }],
    },
    { key: "family.documents", label: "A document for the family", why: "Birth certificates, custody orders, and school and medical forms prove who a child is and who may act for them.", status: "declined", declinedLabel: "Nothing to file yet", actions: [{ label: "Change", kind: "change" }] },
  ],
  depth: [
    {
      key: "family.others", label: "Family and friends who’d help", why: "The parents, siblings, and friends who said “call me”.", status: "present",
      actions: [{ label: "Add another", kind: "add" }],
      people: [
        { name: "Sven Lindqvist", detail: "Sibling · (612) 555-0220", fromContacts: true },
        { name: "Ingrid Falk", detail: "Friend · (503) 555-0270", fromContacts: true },
      ],
    },
  ],
  rail: [
    {
      id: "people", title: "Who you’re protecting", count: "5",
      rows: [
        { kind: "person", name: "Daniel Lindqvist", detail: "The people who depend on you · Emergency contact", reach: { label: "(503) 555-0202", href: "tel:(503) 555-0202" } },
        { kind: "person", name: "Anna Lindqvist", detail: "The people who depend on you", reach: { label: "(206) 555-0210", href: "tel:(206) 555-0210" } },
        { kind: "person", name: "Erik Lindqvist", detail: "The people who depend on you", reach: { label: "(503) 555-0211", href: "tel:(503) 555-0211" } },
        { kind: "person", name: "Sven Lindqvist", detail: "Family and friends who’d help", reach: { label: "(612) 555-0220", href: "tel:(612) 555-0220" } },
        { kind: "person", name: "Ingrid Falk", detail: "Family and friends who’d help", reach: { label: "(503) 555-0270", href: "tel:(503) 555-0270" } },
      ],
    },
    {
      id: "provenance", title: "Where this came from",
      description: "We matched these from how you’d labelled them, and anything unclear stayed where you put it. Family is set up from what was already in your account.",
      links: [{ label: "See all 12 contacts", href: "/section/contacts" }],
    },
    {
      id: "cross", title: "Guardianship and the will",
      description: "A guardian named here is also what the will has to say. Estate & Will shows whether the will is on file.",
      links: [{ label: "Estate & Will", href: "/area/estate", area: "estate" }],
    },
  ],
}
