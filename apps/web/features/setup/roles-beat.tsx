"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { BriefcaseBusinessIcon, HeartIcon, HandHeartIcon, HouseIcon, UserIcon, UsersIcon } from "lucide-react"

import { ChoiceCard } from "@paige/ui/vault/choice-card"
import { FlowFooter } from "@paige/ui/setup/flow-footer"
import { SetupBeat } from "@paige/ui/templates/setup-beat"
import { Badge } from "@paige/ui/components/display/badge"

import type { SetupView } from "@/fixtures/types"
import { PaigeLogo } from "@/features/shell/vault-shell"
import { SetupExit } from "./setup-top-bar"

const AREA_NAME: Record<string, string> = {
  personal: "Personal", family: "Family", household: "Household", money: "Money", assets: "Assets & Property",
  health: "Health", insurance: "Insurance", estate: "Estate & Will", final: "Final Wishes",
}

const ICON: Record<string, ReactNode> = {
  parent: <UsersIcon />,
  partner: <HeartIcon />,
  "caring-parent": <HandHeartIcon />,
  homeowner: <HouseIcon />,
  "business-owner": <BriefcaseBusinessIcon />,
  "on-my-own": <UserIcon />,
}

/** Step 2 · Your roles: the choice-grid beat (multi-select, one exclusive option). */
export function RolesBeat({ setup }: { setup: SetupView }) {
  const [sel, setSel] = useState<string[]>(setup.selectedRoles)
  const toggle = (k: string) =>
    setSel((s) => (s.includes(k) ? s.filter((x) => x !== k) : k === "on-my-own" ? ["on-my-own"] : [...s.filter((x) => x !== "on-my-own"), k]))
  return (
    <SetupBeat
      logo={<PaigeLogo />}
      step={2}
      total={setup.totalSteps}
      exit={<SetupExit />}
      eyebrow="Your roles"
      title="What are the most important roles in your life?"
      lede="This tells us who and what you’re protecting, so we know what areas to guide you through, and what information you’ll need to add."
      footer={
        <FlowFooter
          linkAs={Link}
          backHref="/setup/about-you"
          skipLabel="None of these"
          skipHref="/"
          ctaLabel="Save my roles"
          ctaHref="/"
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {setup.roles.map((r) => (
          <ChoiceCard
            key={r.key}
            layout="tile"
            selected={sel.includes(r.key)}
            onSelectedChange={() => toggle(r.key)}
            icon={ICON[r.key]}
            title={r.label}
            description={r.sub}
            footer={
              r.opens.length > 0 ? (
                r.opens.map((a) => (
                  <Badge key={a} tone="area" area={a}>{AREA_NAME[a]}</Badge>
                ))
              ) : (
                <Badge tone="neutral">Business page</Badge>
              )
            }
          />
        ))}
      </div>
    </SetupBeat>
  )
}
