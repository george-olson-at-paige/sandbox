import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, waitFor } from "storybook/test"

import { Avatar, AvatarGroup } from "./avatar"

/* Avatar (REVIEW-3 group D; R13-13: a photo always has the border, initials never); a ring drawn outside it (white + shadow
   on busy backgrounds, blue for the owner or a selected avatar); a paw for a pet without a
   photo; five sizes; a typed badge (check, edit). When focus styling returns (R1-01) it draws
   outside the ring, never in place of it (R3-09). */
const meta = {
  tags: ["r3-07", "r13-13", "r3-10", "r11-08", "r4-03", "r1-09", "r3-11", "r3-12", "r5-06", "gaps-92"],
  component: Avatar,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl", "2xl"] },
    variant: { control: "select", options: ["person", "pet"] },
    ring: { control: "select", options: [undefined, "default", "me"] },
    selected: { control: "boolean" },
    badge: { control: "select", options: [undefined, "check", "edit"] },
  },
  args: { name: "Maya Reyes", size: "md", variant: "person", selected: false },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

const PHOTO = "assets/avatar-female-glasses.png"

export const Person: Story = {}
export const Photo: Story = {
  name: "Photo (always the border)",
  args: { src: PHOTO },
  play: async ({ canvasElement }) => {
    const avatar = canvasElement.querySelector<HTMLElement>("[data-slot=avatar]")!
    await waitFor(() => expect(avatar.querySelector("img")).not.toBeNull())
    const after = getComputedStyle(avatar, "::after")
    await expect(after.borderTopWidth).toBe("2px")
    await expect(after.borderTopStyle).toBe("solid")
  },
}

export const Pet: Story = {
  name: "Pet (paw by default, letter on request)",
  tags: ["r3-08"],
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar name="Biscuit" variant="pet" size="lg" />
      <Avatar name="Biscuit" variant="pet" size="lg" fallback="letter" />
    </div>
  ),
}

/** Sizes (sm 24 · md 34 · lg 40 · xl 48 · 2xl 74) */
export const Sizes: Story = {
  name: "Sizes · 24 to 74",
  render: () => (
    <div className="flex flex-col gap-4">
      {[{}, { src: PHOTO }].map((p, i) => (
        <div key={i} className="flex items-center gap-4">
          {(["sm", "md", "lg", "xl", "2xl"] as const).map((s) => (
            <Avatar key={s} name="Maya Reyes" size={s} {...p} />
          ))}
          {(["sm", "md", "lg", "xl", "2xl"] as const).map((s) => (
            <Avatar key={`pet-${s}`} name="Biscuit" variant="pet" size={s} />
          ))}
        </div>
      ))}
    </div>
  ),
}

/** Rings: default (white + shadow) and me (blue) */
export const Rings: Story = {
  name: "Rings · default and me",
  render: () => (
    <div className="flex items-center gap-8 rounded-xl bg-accent p-8">
      <Avatar name="Maya Reyes" size="xl" src={PHOTO} />
      <Avatar name="Daniel Reyes" size="xl" ring="default" />
      <Avatar name="Biscuit" variant="pet" size="xl" ring="default" />
      <Avatar name="Maya Reyes" size="xl" src={PHOTO} ring="me" />
    </div>
  ),
}

/** Photo border, every size; initials and paw never. */
export const SubtleRing: Story = {
  name: "Photo border · every size",
  render: () => (
    <div className="flex items-center gap-6 border-b bg-background p-4">
      <Avatar name="Maya Reyes" size="sm" src={PHOTO} />
      <Avatar name="Maya Reyes" size="md" src={PHOTO} />
      <Avatar name="Maya Reyes" size="lg" src={PHOTO} />
      <Avatar name="Maya Reyes" size="xl" src={PHOTO} />
      <Avatar name="Maya Reyes" size="2xl" src={PHOTO} />
      <Avatar name="Maya Reyes" size="md" />
      <Avatar name="Biscuit" variant="pet" size="md" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const avatars = [...canvasElement.querySelectorAll<HTMLElement>("[data-slot=avatar]")]
    await waitFor(() => expect(avatars[4].querySelector("img")).not.toBeNull())
    const width = (el: HTMLElement) => getComputedStyle(el, "::after").borderTopWidth
    await expect(width(avatars[1])).toBe("2px")
    await expect(width(avatars[3])).toBe("3px")
    // Initials and the paw: no border.
    await expect(width(avatars[5])).toBe("0px")
    await expect(width(avatars[6])).toBe("0px")
  },
}

export const Selected: Story = { name: "Selected (the blue ring)", args: { selected: true, src: PHOTO } }

export const Badges: Story = {
  name: "Badge: check or edit (outside the clip)",
  parameters: {
    docs: {
      description: {
        story:
          "sm · md · lg · xl · 2xl, then xl on the \"me\" ring. 2xl uses xl's badge. The icon shows at lg (8 in 16) and xl (12 in 20), sizes that land on whole device pixels at 100, 125 and 150%; sm and md show the plain dot (R5-06).",
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-6">
      {(["check", "edit"] as const).map((b) => (
        <div key={b} className="flex items-center gap-6">
          {(["sm", "md", "lg", "xl", "2xl"] as const).map((s) => (
            <Avatar key={s} name="Maya Reyes" size={s} badge={b} src={s === "md" || s === "xl" ? PHOTO : undefined} />
          ))}
          <Avatar name="Maya Reyes" size="xl" badge={b} ring="me" src={PHOTO} />
        </div>
      ))}
    </div>
  ),
}

const FAMILY = [
  { name: "Maya Reyes", src: PHOTO },
  { name: "David Reyes" },
  { name: "Elena Reyes" },
  { name: "Pepper", variant: "pet" as const },
  { name: "Rosa Alvarez" },
  { name: "Tom Becker" },
]

/* AvatarGroup (restored in R1-25): overlapping avatars with "+N" the same size (R3-13). */
export const Group: Story = {
  name: "AvatarGroup (+N the avatars' size)",
  tags: ["r3-13"],
  render: () => (
    <div className="flex flex-col gap-4">
      {(["sm", "md", "lg", "xl", "2xl"] as const).map((s) => (
        <AvatarGroup key={s} size={s} people={FAMILY} />
      ))}
    </div>
  ),
}
