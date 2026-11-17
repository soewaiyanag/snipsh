import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useMediaQuery, useSeen } from './motion'

const GITHUB_URL = 'https://github.com/soewaiyanag/snipsh'
const ROW_STAGGER_MS = 90
// The pinned track needs room for cards side by side, a pointer to scroll with, and motion allowed.
const TRACK_QUERY = '(min-width: 1024px) and (prefers-reduced-motion: no-preference)'
// Page scroll spent per pixel the row moves sideways; under 1 so the track passes quickly.
const SCROLL_PER_TRACK_PX = 0.6
const SKEW_DEG_PER_PX = 0.08
const MAX_SKEW_DEG = 5
const SKEW_SETTLE_MS = 120

// Every code here is one the API in apps/api really sends, for the reason given.
const ANSWERS = [
  {
    code: 302,
    title: 'Sent on to the long URL.',
    text: 'A 302 and never a 301. Browsers remember a 301 forever, and the clicks after the first would never reach the API to be counted.',
  },
  {
    code: 201,
    title: 'A short link was made.',
    text: 'Leave the slug empty and the API picks seven random characters for it.',
  },
  {
    code: 400,
    title: 'The URL was refused.',
    text: 'It is not an http or https address, or Google Safe Browsing lists it as malware or phishing.',
  },
  {
    code: 404,
    title: 'No link has that slug.',
    text: 'Nothing is redirected, and nothing is counted.',
  },
  {
    code: 409,
    title: 'That slug is taken.',
    text: 'Slugs are unique, so two links can never share one.',
  },
  {
    code: 410,
    title: 'The link was switched off.',
    text: 'Anyone can report a harmful link. One that is switched off stops redirecting for good.',
  },
  {
    code: 429,
    title: 'Too many tries.',
    text: 'Signing in allows 5 attempts a minute. Making links allows 20.',
  },
]

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function Intro() {
  return (
    <>
      <h2 id="codes-title" className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Behind the link, an API that answers in numbers.
      </h2>
      <p className="mt-4 max-w-[58ch] text-lg text-pretty text-muted-foreground">
        snipsh is a NestJS API on PostgreSQL, with this React app in front of it. These are the
        answers it gives, and why.
      </p>
    </>
  )
}

function CodeLink() {
  return (
    <p className="mt-8">
      <a href={GITHUB_URL} target="_blank" rel="noopener" className="font-medium underline hover:no-underline">
        Read the code on GitHub
      </a>
    </p>
  )
}

function Code({ code, isLit, className }: { code: number; isLit: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'block font-mono leading-none font-bold tabular-nums',
        isLit && 'text-ring [text-shadow:0_0_28px_var(--primary)]',
        className,
      )}
    >
      {code}
    </span>
  )
}

// Phones, narrow windows and reduced motion: the answers as a plain list.
function List() {
  const ref = useRef<HTMLOListElement>(null)
  const seen = useSeen(ref)

  return (
    <section aria-labelledby="codes-title" className="mt-28 sm:mt-40">
      <Intro />
      <ol ref={ref} className="mt-12 border-b sm:mt-16">
        {ANSWERS.map(({ code, title, text }, index) => (
          <li
            key={code}
            style={{ animationDelay: `${index * ROW_STAGGER_MS}ms` }}
            className={cn(
              'grid gap-x-10 gap-y-2 border-t py-6 sm:grid-cols-[9rem_1fr] sm:py-8',
              seen ? 'animate-wipe' : '[clip-path:inset(0_100%_0_-2rem)]',
            )}
          >
            <Code code={code} isLit={index === 0} className="text-5xl sm:text-6xl" />
            <div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-1.5 max-w-[60ch] text-pretty text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ol>
      <CodeLink />
    </section>
  )
}

// The section is taller than the screen by the row's overflow. Its pane sticks while that extra
// height scrolls by, and the scroll is spent moving the row sideways instead.
function Track() {
  const section = useRef<HTMLElement>(null)
  const pane = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLOListElement>(null)
  const [travel, setTravel] = useState(0)
  const seen = useSeen(pane)

  useEffect(() => {
    const paneElement = pane.current!
    const measure = () => setTravel(Math.max(row.current!.scrollWidth - paneElement.clientWidth, 0))
    const observer = new ResizeObserver(measure)
    observer.observe(paneElement)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const rowStyle = row.current!.style
    let lastScrollY = window.scrollY
    let settleTimer: ReturnType<typeof setTimeout>

    function update() {
      const progress = travel === 0 ? 0 : clamp(-section.current!.getBoundingClientRect().top / (travel * SCROLL_PER_TRACK_PX), 0, 1)
      const isMoving = progress > 0 && progress < 1
      const skew = isMoving
        ? clamp((window.scrollY - lastScrollY) * SKEW_DEG_PER_PX, -MAX_SKEW_DEG, MAX_SKEW_DEG)
        : 0
      lastScrollY = window.scrollY

      rowStyle.setProperty('--shift', `${-progress * travel}px`)
      rowStyle.setProperty('--progress', String(progress))
      rowStyle.setProperty('--skew', `${-skew}deg`)
      clearTimeout(settleTimer)
      settleTimer = setTimeout(() => rowStyle.setProperty('--skew', '0deg'), SKEW_SETTLE_MS)
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      clearTimeout(settleTimer)
    }
  }, [travel])

  return (
    <section
      ref={section}
      aria-labelledby="codes-title"
      className="mt-40"
      style={{ height: `calc(100svh + ${travel * SCROLL_PER_TRACK_PX}px)` }}
    >
      <div ref={pane} className="sticky top-0 flex h-svh flex-col justify-center">
        <Intro />
        <ol
          ref={row}
          className="mt-16 flex w-max [transform:translate3d(var(--shift,0px),0,0)] will-change-transform"
        >
          {ANSWERS.map(({ code, title, text }, index) => (
            <li
              key={code}
              style={{ animationDelay: `${index * ROW_STAGGER_MS}ms` }}
              className={cn(
                'w-88 shrink-0 border-l pr-10 pl-8',
                seen ? 'animate-in duration-700 ease-out-expo fill-mode-both zoom-in-90 fade-in-0' : 'opacity-0',
              )}
            >
              <div className="[transform:skewX(var(--skew,0deg))] transition-transform duration-300 ease-out">
                {/* The number drifts against the row mid-travel and is back in line at both ends. */}
                <Code
                  code={code}
                  isLit={index === 0}
                  className="[transform:translateX(calc(sin(var(--progress,0)*180deg)*-1.5rem))] text-7xl"
                />
                <h3 className="mt-8 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-pretty text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ol>
        <CodeLink />
      </div>
    </section>
  )
}

export function StatusCodes() {
  return useMediaQuery(TRACK_QUERY) ? <Track /> : <List />
}
