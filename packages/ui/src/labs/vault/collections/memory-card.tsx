import type { ComponentProps, ElementType } from "react"
import { PlayIcon, QuoteIcon } from "lucide-react"

import { cardVariants } from "../../../components/display/card"
import { FileIcon } from "../../../components/display/file-icon"
import { cn } from "../../../lib/utils"
import type { Memory } from "./memories"

/* @archetype Item (ARCHETYPES.md).
   @level 0 — sketch (LEVELS.md). COLLECTIONS-PLAN.md §2–3 (George 2026-11-04): a memory on the
   Memories grid. The picture leads, because for a memory the picture is the point: the photo at
   16:9, cover-cropped; a video shows its play mark on the quiet surface; a file its glyph; a memory that is only its story, a quote mark on the quiet surface, so the
   grid keeps one rhythm and no card looks empty. Under it the title (two lines at most),
   when it happened and its category, and the one-line note. The whole card is the link to the
   memory (Card's interactive hover and focus); nothing else on it acts. */

/** A memory on the grid: its picture, title, when and category, and its note; the card opens it. */
export function MemoryCard({ memory, href, linkAs: Link = "a" }: { memory: Memory; href: string; linkAs?: ElementType }) {
  const f = memory.file
  return (
    <article data-slot="memory-card" className={cn(cardVariants({ interactive: true }), "relative gap-0 overflow-hidden py-0")}>
      <div data-slot="memory-card-media" className="flex aspect-video items-center justify-center bg-surface-page text-muted-foreground">
        {f?.src ? (
          <img src={f.src} alt="" className="size-full object-cover" />
        ) : f && f.name.match(/\.(mp4|mov|m4v|webm)$/i) ? (
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-card shadow-card [&_svg]:size-icon-lg">
            <PlayIcon aria-hidden />
          </span>
        ) : f ? (
          <FileIcon kind={f.kind} file={{ name: f.name }} className="size-10" />
        ) : (
          <QuoteIcon aria-hidden className="size-icon-xl opacity-quiet" />
        )}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold">
          <Link href={href} className="rounded-sm focus-ring after:absolute after:inset-0">
            {memory.title}
          </Link>
        </h3>
        <p className="text-xs font-semibold text-muted-foreground">
          {memory.when} · {memory.category.label}
        </p>
        {memory.note && <p className="line-clamp-2 text-sm font-medium text-muted-foreground">{memory.note}</p>}
      </div>
    </article>
  )
}

export type MemoryCardProps = ComponentProps<typeof MemoryCard>
