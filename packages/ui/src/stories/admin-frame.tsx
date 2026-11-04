import type { ReactNode } from "react"
import { expect } from "storybook/test"

/* The frame every admin page story renders in (R12-09). The sidebar is `fixed` and as tall as the
   viewport (h-svh, upstream); the frame's transform makes `fixed` relative to the frame, so a
   frame shorter than the viewport cut the sidebar's footer (its Collapse control) off below the
   frame: on the AdminPage docs page the 800px frame hid the bottom 100px of a 900px sidebar. The
   frame is the viewport's height, so the whole sidebar, footer included, is always inside it;
   the page scrolls within the frame. Story-only, not exported. */
function AdminFrame({ children }: { children: ReactNode }) {
  return <div data-slot="admin-frame" className="relative h-screen overflow-auto transform-gpu">{children}</div>
}

/** Play helper: the sidebar's footer control ("Collapse", or "Expand" in the rail) is inside the frame, not cut off below it. */
async function expectCollapseInView(canvasElement: HTMLElement) {
  const frame = canvasElement.querySelector<HTMLElement>('[data-slot="admin-frame"]')!
  const control = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar-collapse"]')
  await expect(control).not.toBeNull()
  const f = frame.getBoundingClientRect()
  const c = control!.getBoundingClientRect()
  await expect(c.height).toBeGreaterThan(0)
  await expect(c.top >= f.top && c.bottom <= f.bottom).toBe(true)
}

export { AdminFrame, expectCollapseInView }
