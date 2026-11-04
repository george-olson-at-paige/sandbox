"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { FlowFooter } from "@paige/ui/setup/flow-footer"
import { useForm } from "@paige/ui/forms/form"
import { SetupBeat } from "@paige/ui/templates/setup-beat"

import type { SetupView } from "@/fixtures/types"
import { PaigeLogo } from "@/features/shell/vault-shell"
import { AboutYouForm, type AboutYouValues } from "./forms/about-you-form"
import { SetupExit } from "./setup-top-bar"

/** Step 1 · About you: the beat composes SetupBeat and the About you form. The CTA waits for a legal name. */
export function AboutYouBeat({ setup }: { setup: SetupView }) {
  const router = useRouter()
  const [values, setValues] = useState<AboutYouValues>(setup.about)
  const missingName = !values.legalName.trim()
  const form = useForm({
    id: "about-you",
    values,
    disabled: missingName,
    // No save endpoint yet (R2-38): a submit checks the fields and moves on, as the link did; it saves nothing.
    onSubmit: () => router.push("/setup/roles"),
  })
  return (
    <SetupBeat
      logo={<PaigeLogo />}
      step={1}
      total={setup.totalSteps}
      exit={<SetupExit />}
      eyebrow="About you"
      title="Let’s start with the things only you can tell us."
      lede="Your licence carries your address and date of birth, so we’ll read those from the photo and save you the typing."
      footer={
        <FlowFooter
          ctaLabel="Save my details"
          submit={form.submitProps}
          note={missingName ? "Your legal name is the one thing here we can’t skip." : undefined}
        />
      }
    >
      <AboutYouForm form={form} values={values} onChange={setValues} />
    </SetupBeat>
  )
}
