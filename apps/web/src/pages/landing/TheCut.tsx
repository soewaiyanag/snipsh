import { useEffect, useRef, useState } from 'react'
import { shortLinkLabel } from '@/lib/short-link'
import { prefersReducedMotion } from './motion'

// A sample address; this short link does not exist.
const SAMPLE_URL =
  'https://shop.example.net/collections/winter/products/wool-scarf-charcoal?variant=40211&ref=story'
const SAMPLE_SLUG = 'Wq0_m7e'

// How far the page scrolls while the section is pinned.
const PIN_TRAVEL_PX = 900
// The cut waits a little at each end, so both the long URL and the short link get a still moment.
const CUT_START = 0.1
const CUT_END = 0.9

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

function Intro() {
  return (
    <>
      <h2 id="cut-title" className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        You share the short end. The long one waits behind it.
      </h2>
      <p className="mt-4 max-w-[58ch] text-lg text-pretty text-muted-foreground">
        A short link is a few characters on the API’s own address. Whoever opens it is sent on to
        the full URL, however long it is.
      </p>
    </>
  )
}

function Addresses() {
  return (
    <>
      <dl className="mt-10 grid max-w-3xl gap-x-12 gap-y-4 border-t pt-6 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-muted-foreground">Long URL</dt>
        <dd className="link-text min-w-0">{SAMPLE_URL}</dd>
        <dt className="text-muted-foreground">Short link</dt>
        <dd className="link-text font-semibold">{shortLinkLabel(SAMPLE_SLUG)}</dd>
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">Sample addresses.</p>
    </>
  )
}

// The section pins while the page scrolls, and the scroll drives a cut line across the long URL:
// down wipes it away and leaves the short link, back up puts it together again.
function PinnedCut() {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function update() {
      const progress = -section.current!.getBoundingClientRect().top / PIN_TRAVEL_PX
      const cut = clamp01((progress - CUT_START) / (CUT_END - CUT_START))
      stage.current!.style.setProperty('--cut', String(cut))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <section ref={section} aria-labelledby="cut-title" style={{ height: `calc(100svh + ${PIN_TRAVEL_PX}px)` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center">
        <Intro />
        <div ref={stage} aria-hidden className="relative mt-14 h-[1.6em] text-lg sm:mt-20 sm:text-4xl">
          <span className="link-text absolute inset-0 [clip-path:inset(-1em_0_-1em_calc(var(--cut,0)*100%))] whitespace-nowrap text-muted-foreground [mask-image:linear-gradient(to_right,#000_75%,transparent)] [overflow-wrap:normal]">
            {SAMPLE_URL}
          </span>
          <span className="link-text absolute inset-0 [clip-path:inset(-1em_calc((1-var(--cut,0))*100%)_-1em_0)] font-bold">
            {shortLinkLabel(SAMPLE_SLUG)}
          </span>
          <span className="absolute -inset-y-4 left-[calc(var(--cut,0)*100%)] w-0.5 rounded-full bg-ring shadow-[0_0_18px_3px_var(--primary)]" />
        </div>
        <Addresses />
      </div>
    </section>
  )
}

export function TheCut() {
  const [isStill] = useState(prefersReducedMotion)
  if (!isStill) return <PinnedCut />

  return (
    <section aria-labelledby="cut-title" className="mt-12 sm:mt-16">
      <Intro />
      <Addresses />
    </section>
  )
}
