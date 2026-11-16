import { useEffect, useRef, useState } from 'react'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { linePath, SAMPLE_CLICKS_PER_DAY, SAMPLE_REFERRERS, SAMPLE_TOTAL } from './click-line'
import { prefersReducedMotion, useSeen } from './motion'

const CHART_WIDTH = 1000
const CHART_HEIGHT = 220
const DRAW_MS = 2400
const PATH = linePath(SAMPLE_CLICKS_PER_DAY, CHART_WIDTH, CHART_HEIGHT)

const easeOutExpo = (progress: number) => (progress === 1 ? 1 : 1 - 2 ** (-10 * progress))

// Counts up in step with the line being drawn.
function useCountUp(target: number, start: boolean) {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))

  useEffect(() => {
    if (!start || prefersReducedMotion()) return
    const startedAt = performance.now()
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min((now - startedAt) / DRAW_MS, 1)
      setValue(Math.round(easeOutExpo(progress) * target))
      if (progress < 1) frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [target, start])

  return value
}

function referrerName(referrer: string) {
  return referrer === '' ? 'direct visits' : referrer
}

export function ClickLine() {
  const ref = useRef<HTMLDivElement>(null)
  const seen = useSeen(ref)
  const clicks = useCountUp(SAMPLE_TOTAL, seen)
  const [first, ...rest] = SAMPLE_REFERRERS

  return (
    <section aria-labelledby="clicks-title" className="mt-28 sm:mt-40">
      <h2 id="clicks-title" className="max-w-3xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        Then every click is counted.
      </h2>
      <p className="mt-4 max-w-[58ch] text-lg text-pretty text-muted-foreground">
        Each click on a short link is saved with the site it came from. You see the total, the days
        it was busy, and where people found it.
      </p>

      <div ref={ref} className="mt-12 sm:mt-16">
        <p className="flex items-baseline gap-3">
          <span className="text-6xl font-bold tracking-tight tabular-nums sm:text-8xl">{formatNumber(clicks)}</span>
          <span className="text-muted-foreground">clicks in 30 days</span>
        </p>

        <svg
          role="img"
          aria-label={`A line of clicks per day over 30 days, ${SAMPLE_TOTAL} in total, with two busy peaks.`}
          viewBox={`0 -12 ${CHART_WIDTH} ${CHART_HEIGHT + 24}`}
          preserveAspectRatio="none"
          className="mt-8 h-40 w-full overflow-visible sm:h-56"
        >
          <path
            d={PATH}
            pathLength={1}
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={2}
            strokeLinejoin="round"
            className={cn(
              'stroke-ring [stroke-dasharray:1] drop-shadow-[0_0_10px_var(--primary)]',
              seen ? 'animate-draw-line' : '[stroke-dashoffset:1]',
            )}
          />
        </svg>
        <div className="mt-3 flex justify-between border-t pt-3 text-sm text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>

        <p className="mt-10 max-w-[60ch] text-lg text-pretty">
          Most came from <span className="link-text font-semibold">{first.referrer}</span>{' '}
          <span className="text-muted-foreground tabular-nums">({first.count})</span>, then{' '}
          {rest.map(({ referrer, count }, position) => (
            <span key={referrer}>
              {position === rest.length - 1 && 'and '}
              <span className={cn('font-semibold', referrer !== '' && 'link-text')}>{referrerName(referrer)}</span>{' '}
              <span className="text-muted-foreground tabular-nums">({count})</span>
              {position < rest.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">A sample link with sample clicks.</p>
      </div>
    </section>
  )
}
