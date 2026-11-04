import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { PageIntro } from "@paige/ui/patterns/page-intro"
import { Button } from "@paige/ui/components/actions/button"

import type { HomeView } from "@/fixtures/types"

/** Hero: one next step, one line. Home only. */
export function Hero({ hero }: { hero: HomeView["hero"] }) {
  return (
    <PageIntro
      eyebrow={hero.eyebrow}
      title={hero.title}
      lede={hero.body}
      actions={
        hero.cta && (
          <Button asChild size="lg" icon={<ArrowRightIcon />} iconPosition="end">
            <Link href={hero.cta.href}>{hero.cta.label}</Link>
          </Button>
        )
      }
    />
  )
}
