import type { JourneyOption, JourneyUsage } from "../admin/journey-rules"

/* Journeys data for the stories and the app's /admin/journeys (R21-21; one copy, R17-03): real
   `GET admin/usage/journeys` responses, recorded 1 Nov 2026 from the local stack (RC API on
   Lane 3's 5d1f89200, local events, test accounts) as the local operator, GETs only. Aggregates
   only: no people. Trimmed to the fields `JourneyUsage` reads; generated, do not edit by hand
   (the recorder and generator are in the Lane 2 hand-off). Keyed `<journey>.<range>.<entry>`:
   the three journeys with tabs of their own (Sign-up, Essential Setup, First things) for all
   time, the last 7 days (from 25 Oct) and the last 30 days (from 2 Oct), for everyone: none of
   the three has an entry segment (Setup's went 2026-11-01, Lane 3's 5d1f89200), so `entries`
   is empty. A combination not recorded answers null. Fixtures only: package code
   never imports this folder (check-layers); it goes when the app's API module serves the data. */

/** When the responses were recorded (the page's `meta` says so). */
export const journeysRecordedAt = "2026-11-01"

/** Every journey the API lists (the tabs: those with no `group`). */
export const journeyOptions: JourneyOption[] = [
  {
    "key": "essential-setup",
    "label": "Essential Setup",
    "group": null
  },
  {
    "key": "sign-up",
    "label": "Sign-up",
    "group": null
  },
  {
    "key": "first-things",
    "label": "First things in the Vault",
    "group": null
  },
  {
    "key": "area-personal",
    "label": "Personal",
    "group": "areas"
  },
  {
    "key": "area-family",
    "label": "Family",
    "group": "areas"
  },
  {
    "key": "area-household",
    "label": "Household",
    "group": "areas"
  },
  {
    "key": "area-money",
    "label": "Money",
    "group": "areas"
  },
  {
    "key": "area-assets",
    "label": "Assets & Property",
    "group": "areas"
  },
  {
    "key": "area-health",
    "label": "Health",
    "group": "areas"
  },
  {
    "key": "area-insurance",
    "label": "Insurance",
    "group": "areas"
  },
  {
    "key": "area-estate",
    "label": "Estate & Will",
    "group": "areas"
  },
  {
    "key": "area-final",
    "label": "Final Wishes",
    "group": "areas"
  }
]

/** The recorded responses, by `<journey>.<range>.<entry>`. */
export const journeyRecordings: Record<string, JourneyUsage> = {
  "essential-setup.30d.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"essential-setup","label":"Essential Setup","group":null,"entries":[],"entry":null,"people":106,"reachedEnd":18,"tasks":[{"key":"setup-welcome","label":"Welcome","optional":false,"reached":106,"activeSpread":{"count":6,"p25":5,"median":5,"p75":13,"p90":14},"next":[{"key":"continue","visits":6}]},{"key":"setup-about-you","label":"About you","optional":false,"reached":94,"activeSpread":{"count":3,"p25":13,"median":14,"p75":24,"p90":24},"next":[{"key":"continue","visits":4},{"key":"exit","visits":3}]},{"key":"setup-your-people","label":"Your people","optional":false,"reached":95,"activeSpread":{"count":4,"p25":21,"median":27,"p75":29,"p90":29},"next":[{"key":"continue","visits":4},{"key":"back","visits":1}]},{"key":"setup-what-they-need","label":"What they'd need","optional":false,"reached":65,"activeSpread":{"count":3,"p25":6,"median":6,"p75":8,"p90":8},"next":[{"key":"continue","visits":3},{"key":"away","visits":1}]},{"key":"setup-documents","label":"Documents","optional":false,"reached":63,"activeSpread":{"count":3,"p25":27,"median":32,"p75":33,"p90":33},"next":[{"key":"continue","visits":3}]},{"key":"setup-who-steps-in","label":"Who steps in","optional":false,"reached":58,"activeSpread":{"count":3,"p25":12,"median":13,"p75":27,"p90":27},"next":[{"key":"continue","visits":4}]},{"key":"setup-getting-in","label":"Getting in","optional":false,"reached":55,"activeSpread":{"count":3,"p25":9,"median":9,"p75":22,"p90":22},"next":[{"key":"continue","visits":3},{"key":"navigate","visits":1}]},{"key":"setup-check","label":"Check what we read","optional":true,"reached":19,"activeSpread":{"count":2,"p25":10,"median":10,"p75":10,"p90":10},"next":[{"key":"continue","visits":2}]},{"key":"setup-in-place","label":"What you've put in place","optional":false,"reached":18,"activeSpread":{"count":1,"p25":14,"median":14,"p75":14,"p90":14},"next":[{"key":"continue","visits":1}]}],"edges":[{"from":"setup-welcome","to":"setup-about-you"},{"from":"setup-about-you","to":"setup-your-people"},{"from":"setup-your-people","to":"setup-what-they-need"},{"from":"setup-what-they-need","to":"setup-documents"},{"from":"setup-documents","to":"setup-who-steps-in"},{"from":"setup-who-steps-in","to":"setup-getting-in"},{"from":"setup-getting-in","to":"setup-check"},{"from":"setup-getting-in","to":"setup-in-place"},{"from":"setup-check","to":"setup-in-place"}]} },
  "essential-setup.7d.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"essential-setup","label":"Essential Setup","group":null,"entries":[],"entry":null,"people":105,"reachedEnd":18,"tasks":[{"key":"setup-welcome","label":"Welcome","optional":false,"reached":105,"activeSpread":{"count":6,"p25":5,"median":5,"p75":13,"p90":14},"next":[{"key":"continue","visits":6}]},{"key":"setup-about-you","label":"About you","optional":false,"reached":93,"activeSpread":{"count":3,"p25":13,"median":14,"p75":24,"p90":24},"next":[{"key":"continue","visits":4},{"key":"exit","visits":3}]},{"key":"setup-your-people","label":"Your people","optional":false,"reached":95,"activeSpread":{"count":4,"p25":21,"median":27,"p75":29,"p90":29},"next":[{"key":"continue","visits":4},{"key":"back","visits":1}]},{"key":"setup-what-they-need","label":"What they'd need","optional":false,"reached":65,"activeSpread":{"count":3,"p25":6,"median":6,"p75":8,"p90":8},"next":[{"key":"continue","visits":3},{"key":"away","visits":1}]},{"key":"setup-documents","label":"Documents","optional":false,"reached":62,"activeSpread":{"count":3,"p25":27,"median":32,"p75":33,"p90":33},"next":[{"key":"continue","visits":3}]},{"key":"setup-who-steps-in","label":"Who steps in","optional":false,"reached":58,"activeSpread":{"count":3,"p25":12,"median":13,"p75":27,"p90":27},"next":[{"key":"continue","visits":4}]},{"key":"setup-getting-in","label":"Getting in","optional":false,"reached":55,"activeSpread":{"count":3,"p25":9,"median":9,"p75":22,"p90":22},"next":[{"key":"continue","visits":3},{"key":"navigate","visits":1}]},{"key":"setup-check","label":"Check what we read","optional":true,"reached":19,"activeSpread":{"count":2,"p25":10,"median":10,"p75":10,"p90":10},"next":[{"key":"continue","visits":2}]},{"key":"setup-in-place","label":"What you've put in place","optional":false,"reached":18,"activeSpread":{"count":1,"p25":14,"median":14,"p75":14,"p90":14},"next":[{"key":"continue","visits":1}]}],"edges":[{"from":"setup-welcome","to":"setup-about-you"},{"from":"setup-about-you","to":"setup-your-people"},{"from":"setup-your-people","to":"setup-what-they-need"},{"from":"setup-what-they-need","to":"setup-documents"},{"from":"setup-documents","to":"setup-who-steps-in"},{"from":"setup-who-steps-in","to":"setup-getting-in"},{"from":"setup-getting-in","to":"setup-check"},{"from":"setup-getting-in","to":"setup-in-place"},{"from":"setup-check","to":"setup-in-place"}]} },
  "essential-setup.all.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"essential-setup","label":"Essential Setup","group":null,"entries":[],"entry":null,"people":106,"reachedEnd":18,"tasks":[{"key":"setup-welcome","label":"Welcome","optional":false,"reached":106,"activeSpread":{"count":6,"p25":5,"median":5,"p75":13,"p90":14},"next":[{"key":"continue","visits":6}]},{"key":"setup-about-you","label":"About you","optional":false,"reached":94,"activeSpread":{"count":3,"p25":13,"median":14,"p75":24,"p90":24},"next":[{"key":"continue","visits":4},{"key":"exit","visits":3}]},{"key":"setup-your-people","label":"Your people","optional":false,"reached":95,"activeSpread":{"count":4,"p25":21,"median":27,"p75":29,"p90":29},"next":[{"key":"continue","visits":4},{"key":"back","visits":1}]},{"key":"setup-what-they-need","label":"What they'd need","optional":false,"reached":65,"activeSpread":{"count":3,"p25":6,"median":6,"p75":8,"p90":8},"next":[{"key":"continue","visits":3},{"key":"away","visits":1}]},{"key":"setup-documents","label":"Documents","optional":false,"reached":63,"activeSpread":{"count":3,"p25":27,"median":32,"p75":33,"p90":33},"next":[{"key":"continue","visits":3}]},{"key":"setup-who-steps-in","label":"Who steps in","optional":false,"reached":58,"activeSpread":{"count":3,"p25":12,"median":13,"p75":27,"p90":27},"next":[{"key":"continue","visits":4}]},{"key":"setup-getting-in","label":"Getting in","optional":false,"reached":55,"activeSpread":{"count":3,"p25":9,"median":9,"p75":22,"p90":22},"next":[{"key":"continue","visits":3},{"key":"navigate","visits":1}]},{"key":"setup-check","label":"Check what we read","optional":true,"reached":19,"activeSpread":{"count":2,"p25":10,"median":10,"p75":10,"p90":10},"next":[{"key":"continue","visits":2}]},{"key":"setup-in-place","label":"What you've put in place","optional":false,"reached":18,"activeSpread":{"count":1,"p25":14,"median":14,"p75":14,"p90":14},"next":[{"key":"continue","visits":1}]}],"edges":[{"from":"setup-welcome","to":"setup-about-you"},{"from":"setup-about-you","to":"setup-your-people"},{"from":"setup-your-people","to":"setup-what-they-need"},{"from":"setup-what-they-need","to":"setup-documents"},{"from":"setup-documents","to":"setup-who-steps-in"},{"from":"setup-who-steps-in","to":"setup-getting-in"},{"from":"setup-getting-in","to":"setup-check"},{"from":"setup-getting-in","to":"setup-in-place"},{"from":"setup-check","to":"setup-in-place"}]} },
  "first-things.30d.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"first-things","label":"First things in the Vault","group":null,"entries":[],"entry":null,"people":131,"reachedEnd":49,"tasks":[{"key":"first-person","label":"Add someone","optional":false,"reached":117,"activeSpread":{"count":104,"p25":0,"median":1,"p75":5,"p90":108},"next":[]},{"key":"first-document","label":"Add a document","optional":false,"reached":93,"activeSpread":{"count":84,"p25":0,"median":0,"p75":5,"p90":15},"next":[]},{"key":"review-documents","label":"Check what was read","optional":false,"reached":50,"activeSpread":{"count":3,"p25":0,"median":0,"p75":0,"p90":0},"next":[]}],"edges":[{"from":"first-document","to":"review-documents"}]} },
  "first-things.7d.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"first-things","label":"First things in the Vault","group":null,"entries":[],"entry":null,"people":130,"reachedEnd":49,"tasks":[{"key":"first-person","label":"Add someone","optional":false,"reached":117,"activeSpread":{"count":104,"p25":0,"median":1,"p75":5,"p90":108},"next":[]},{"key":"first-document","label":"Add a document","optional":false,"reached":92,"activeSpread":{"count":84,"p25":0,"median":0,"p75":5,"p90":15},"next":[]},{"key":"review-documents","label":"Check what was read","optional":false,"reached":50,"activeSpread":{"count":3,"p25":0,"median":0,"p75":0,"p90":0},"next":[]}],"edges":[{"from":"first-document","to":"review-documents"}]} },
  "first-things.all.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"first-things","label":"First things in the Vault","group":null,"entries":[],"entry":null,"people":131,"reachedEnd":49,"tasks":[{"key":"first-person","label":"Add someone","optional":false,"reached":117,"activeSpread":{"count":104,"p25":0,"median":1,"p75":5,"p90":108},"next":[]},{"key":"first-document","label":"Add a document","optional":false,"reached":93,"activeSpread":{"count":84,"p25":0,"median":0,"p75":5,"p90":15},"next":[]},{"key":"review-documents","label":"Check what was read","optional":false,"reached":50,"activeSpread":{"count":3,"p25":0,"median":0,"p75":0,"p90":0},"next":[]}],"edges":[{"from":"first-document","to":"review-documents"}]} },
  "sign-up.30d.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"sign-up","label":"Sign-up","group":null,"entries":[],"entry":null,"people":169,"reachedEnd":163,"tasks":[{"key":"create-account","label":"Create an account","optional":false,"reached":169,"activeSpread":{"count":0,"p25":null,"median":null,"p75":null,"p90":null},"next":[]},{"key":"verify-phone","label":"Verify a phone","optional":false,"reached":163,"activeSpread":{"count":163,"p25":0,"median":0,"p75":0,"p90":0},"next":[]},{"key":"verify-email","label":"Verify their email","optional":false,"reached":169,"activeSpread":{"count":0,"p25":null,"median":null,"p75":null,"p90":null},"next":[]}],"edges":[{"from":"create-account","to":"verify-phone"},{"from":"create-account","to":"verify-email"}]} },
  "sign-up.7d.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"sign-up","label":"Sign-up","group":null,"entries":[],"entry":null,"people":166,"reachedEnd":162,"tasks":[{"key":"create-account","label":"Create an account","optional":false,"reached":166,"activeSpread":{"count":0,"p25":null,"median":null,"p75":null,"p90":null},"next":[]},{"key":"verify-phone","label":"Verify a phone","optional":false,"reached":162,"activeSpread":{"count":162,"p25":0,"median":0,"p75":0,"p90":0},"next":[]},{"key":"verify-email","label":"Verify their email","optional":false,"reached":166,"activeSpread":{"count":0,"p25":null,"median":null,"p75":null,"p90":null},"next":[]}],"edges":[{"from":"create-account","to":"verify-phone"},{"from":"create-account","to":"verify-email"}]} },
  "sign-up.all.all": { journeys: journeyOptions, ...{"eventsAvailable":true,"key":"sign-up","label":"Sign-up","group":null,"entries":[],"entry":null,"people":170,"reachedEnd":164,"tasks":[{"key":"create-account","label":"Create an account","optional":false,"reached":170,"activeSpread":{"count":0,"p25":null,"median":null,"p75":null,"p90":null},"next":[]},{"key":"verify-phone","label":"Verify a phone","optional":false,"reached":164,"activeSpread":{"count":164,"p25":0,"median":0,"p75":0,"p90":0},"next":[]},{"key":"verify-email","label":"Verify their email","optional":false,"reached":170,"activeSpread":{"count":0,"p25":null,"median":null,"p75":null,"p90":null},"next":[]}],"edges":[{"from":"create-account","to":"verify-phone"},{"from":"create-account","to":"verify-email"}]} },
}
