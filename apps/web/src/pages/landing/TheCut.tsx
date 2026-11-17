import { useEffect, useRef, useState } from 'react'
import { shortLinkLabel } from '@/lib/short-link'
import { cn } from '@/lib/utils'
import { prefersReducedMotion } from './motion'

// A sample address; this short link does not exist.
const SAMPLE_URL =
  'https://shop.example.net/collections/winter/products/wool-scarf-charcoal?variant=40211&ref=story'
const SAMPLE_SLUG = 'Wq0_m7e'

// How far the page scrolls while the section is pinned.
const PIN_TRAVEL_PX = 500
// Scroll past this share of the pinned distance and the cut plays; scroll back above it and it undoes.
const CUT_AT = 0.35
const CUT_MOTION = 'duration-700 ease-out-expo'

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

// The section pins while the page scrolls. Passing the threshold snaps the cut line across the
// long URL and leaves the short link; scrolling back above it puts the long URL together again.
function PinnedCut() {
  const section = useRef<HTMLElement>(null)
  const [isCut, setIsCut] = useState(false)

  useEffect(() => {
    function update() {
      setIsCut(-section.current!.getBoundingClientRect().top / PIN_TRAVEL_PX > CUT_AT)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <section ref={section} aria-labelledby="cut-title" style={{ height: `calc(100svh + ${PIN_TRAVEL_PX}px)` }}>
      <div className="sticky top-0 flex h-svh flex-col justify-center">
        <Intro />
        <div aria-hidden className="relative mt-14 h-[1.6em] text-lg sm:mt-20 sm:text-4xl">
          <span
            className={cn(
              'link-text absolute inset-0 whitespace-nowrap text-muted-foreground transition-[clip-path] [mask-image:linear-gradient(to_right,#000_75%,transparent)] [overflow-wrap:normal]',
              CUT_MOTION,
              isCut ? '[clip-path:inset(-1em_0_-1em_100%)]' : '[clip-path:inset(-1em_0_-1em_0)]',
            )}
          >
            {SAMPLE_URL}
          </span>
          <span
            className={cn(
              'link-text absolute inset-0 font-bold transition-[clip-path]',
              CUT_MOTION,
              isCut ? '[clip-path:inset(-1em_0_-1em_0)]' : '[clip-path:inset(-1em_100%_-1em_0)]',
            )}
          >
            {shortLinkLabel(SAMPLE_SLUG)}
          </span>
          <span className={cn('absolute inset-0 transition-transform', CUT_MOTION, isCut && 'translate-x-full')}>
            <span className="absolute -inset-y-4 left-0 w-0.5 rounded-full bg-ring shadow-[0_0_18px_3px_var(--primary)]" />
          </span>
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
