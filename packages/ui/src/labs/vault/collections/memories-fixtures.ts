import type { Memory, MemoryCategory } from "./memories"

/* @level 0. Memories' words and one owner's memories, for the labs stories. The title and lead
   are the Vue page's; words marked ⟨new⟩ need Product. The categories and their prompts are
   stand-ins: the real catalog is the API's (`GET memories/categories`, seeded from legacy by
   MemoryMigrator). */

export const MEMORY_CATEGORIES: MemoryCategory[] = [
  { id: "family", label: "Family", prompts: ["Who was there", "What we did", "What I want you to remember"] },
  { id: "wedding", label: "Wedding", prompts: ["How we met", "The day itself", "What I’d tell you about marriage"] },
  { id: "birthday", label: "Birthday", prompts: ["The party", "The gift", "Who I was that year"] },
  { id: "travel", label: "Travel", prompts: ["Where we went", "What surprised me", "Where I’d go again"] },
  { id: "home", label: "Home", prompts: ["The house", "The neighbors", "What it smelled like"] },
  { id: "other", label: "Something else", prompts: [] },
]
const category = (id: string) => MEMORY_CATEGORIES.find((c) => c.id === id)!

export const MEMORIES_COPY = {
  title: "Memories",
  lead: "Capture the moments worth holding onto — a story, a photo, a milestone.",
  count: (n: number) => (n === 0 ? "None yet" : n === 1 ? "1 memory" : `${n} memories`), // ⟨new⟩
  add: "Add a memory", // ⟨new⟩
  search: "Search memories", // ⟨new⟩
  categories: "Category",
  view: "View",
  grid: "Grid",
  timeline: "Timeline",
  timelineLabel: "Memories, by when they happened", // ⟨new⟩
  none: "No memory matches that.", // ⟨new⟩
  clear: "Clear search and filters",
  emptyTitle: "No memories yet", // ⟨new⟩
  emptyLine: "Start with one you tell often — the story everyone asks for.", // ⟨new⟩
  back: "Memories",
  edit: "Edit",
  more: (title: string) => `Actions for ${title}`, // ⟨new⟩
  remove: "Delete this memory", // ⟨new⟩
  removeConfirm: (title: string) => ({
    title: `Delete “${title}”?`,
    description: "Its story and its photo go with it.", // ⟨new⟩
    confirmLabel: "Delete it",
  }),
  note: "In a sentence", // ⟨new⟩
  who: "Only you can see this for now. Choosing who it goes to comes later.", // ⟨new⟩ (sharing is deferred, D10)
  openFile: (name: string) => `Open ${name}`,
  form: {
    addTitle: "Add a memory", // ⟨new⟩
    editTitle: (title: string) => `Edit ${title}`, // ⟨new⟩
    about: "The memory", // ⟨new⟩
    category: "Category",
    categoryPlaceholder: "Choose a category",
    title: "Title",
    titleHint: "What you’d call it when you tell it: “The summer at Wallowa Lake”.", // ⟨new⟩
    occurredOn: "When it happened", // ⟨new⟩
    note: "In a sentence", // ⟨new⟩
    noteHint: "Optional. What it was, in one line.", // ⟨new⟩
    story: "The story", // ⟨new⟩
    storyHint: "Tell it in parts. Each part has a title and what you remember.", // ⟨new⟩
    sectionTitle: "Title",
    sectionText: "What you remember", // ⟨new⟩
    sectionRow: (i: number) => `Part ${i + 1}`, // ⟨new⟩
    addSection: "Add a part", // ⟨new⟩
    suggestions: "Start a part with", // ⟨new⟩
    reorder: "Order of the parts", // ⟨new⟩
    file: "Photo, video or file", // ⟨new⟩
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    required: "Enter a value.",
  },
  file: {
    add: "Add a photo, video or file", // ⟨new⟩
    replace: "Replace it", // ⟨new⟩
    line: "One per memory", // ⟨new⟩
    tooMany: () => "One file per memory.", // ⟨new⟩
    wrongKind: "That kind of file can’t go here.",
    remove: (name: string) => `Remove ${name}`,
    retry: (name: string) => `Try ${name} again`,
  },
}

export const MEMORIES: Memory[] = [
  {
    id: "wallowa",
    title: "The summer at Wallowa Lake",
    category: category("family"),
    occurredOn: "1994-07-16",
    when: "July 16, 1994",
    note: "Two weeks in a borrowed cabin, the four of us and a canoe with a hole in it.",
    sections: [
      { id: "s1", title: "Who was there", text: "Your dad, you and Tomás, and me. Grandma came up for the last weekend and won every card game." },
      { id: "s2", title: "What we did", text: "We patched the canoe with duct tape the first morning. It held for exactly one trip across the lake." },
    ],
    file: { id: "f1", name: "wallowa-1994.jpg", kind: "image", src: "/assets/fixture-memories/lake.svg" },
  },
  {
    id: "wedding",
    title: "Our wedding in the garden",
    category: category("wedding"),
    occurredOn: "1987-06-14",
    when: "June 14, 1987",
    note: "It rained for ten minutes and nobody went inside.",
    sections: [{ id: "s1", title: "The day itself", text: "My mother cried before the ceremony and laughed through all of it." }],
    file: { id: "f1", name: "wedding-1987.jpg", kind: "image", src: "/assets/fixture-memories/garden.svg" },
  },
  {
    id: "kitchen",
    title: "Sunday tamales",
    category: category("home"),
    occurredOn: "2009-12-20",
    when: "December 20, 2009",
    sections: [{ id: "s1", title: "What it smelled like", text: "Masa, chiles, and the radiator that clanked every hour." }],
    file: { id: "f1", name: "tamales.jpg", kind: "image", src: "/assets/fixture-memories/kitchen.svg" },
  },
  {
    id: "elena-9",
    title: "Elena’s ninth birthday",
    category: category("birthday"),
    occurredOn: "2017-03-02",
    when: "March 2, 2017",
    note: "The year of the dinosaur cake.",
    sections: [],
  },
  {
    id: "cannon",
    title: "Cannon Beach, the windy year",
    category: category("travel"),
    occurredOn: "2017-08-05",
    when: "August 5, 2017",
    sections: [],
    file: { id: "f1", name: "cannon-beach.mp4", kind: "other" },
  },
  {
    id: "letter",
    title: "Papá’s letter from Guadalajara",
    category: category("family"),
    occurredOn: "1979-11-01",
    when: "November 1979",
    note: "The only letter he ever wrote me. It’s in the cedar box.",
    sections: [],
    file: { id: "f1", name: "papa-letter.pdf", kind: "pdf" },
  },
]
