import { ChartLineIcon, QrCodeIcon } from 'lucide-react'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import type { Link } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, formatNumber, formatRelative } from '@/lib/format'
import { SHORT_LINK_PREFIX, shortLinkLabel } from '@/lib/short-link'
import { cn } from '@/lib/utils'
import { CopyButton } from './CopyButton'
import { DeleteLinkButton } from './DeleteLinkButton'
import { LinkStatus } from './LinkStatus'
import { QrCode } from './QrCode'

// Shared by the header, the rows and the skeletons so the columns always line up.
export const ROW_GRID = 'sm:grid sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem_auto] sm:items-center sm:gap-x-4'

export function LinkRowsHeader() {
  return (
    <div
      aria-hidden
      className={cn('hidden px-3 pb-2 font-mono text-[0.6875rem] text-subtle', ROW_GRID)}
    >
      <span>link</span>
      <span className="text-right">clicks</span>
      <span>created</span>
      <span className="w-36" />
    </div>
  )
}

export function LinkRow({ link, isNew }: { link: Link; isNew: boolean }) {
  const [showsQr, setShowsQr] = useState(false)
  const label = shortLinkLabel(link.slug)

  return (
    <li
      className={cn(
        'grid gap-y-1.5 border-t border-border px-3 py-2.5 transition-colors first:border-t-0 focus-within:bg-muted/60 hover:bg-muted/60',
        ROW_GRID,
        isNew && 'animate-settle',
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <RouterLink
            to={`/links/${link.id}`}
            className="link-text rounded-sm text-sm outline-none hover:underline focus-visible:ring-1 focus-visible:ring-ring"
          >
            {/* The domain is the same on every row, so it steps back and the slug leads. */}
            <span className="text-subtle">{SHORT_LINK_PREFIX}</span>
            <span className="font-semibold">{link.slug}</span>
          </RouterLink>
          <LinkStatus link={link} />
        </div>
        <p className="link-text mt-0.5 truncate text-xs text-muted-foreground" title={link.url}>
          <span className="sr-only">Goes to </span>
          {link.url}
        </p>
      </div>

      {/* Below sm the numbers and the actions share one line under the link. */}
      <div className="flex items-center justify-between gap-3 sm:contents">
        <div className="flex gap-3 font-mono text-xs text-muted-foreground tabular-nums sm:contents">
          <p className="whitespace-nowrap sm:text-right">
            {link.clicks === undefined ? (
              <span title="Click counts are not available yet">–</span>
            ) : (
              <>
                <span className="text-foreground">{formatNumber(link.clicks)}</span>
                <span className="sm:sr-only"> clicks</span>
              </>
            )}
          </p>
          <p className="whitespace-nowrap" title={formatDate(link.createdAt)}>
            <span className="sr-only">Made </span>
            {formatRelative(link.createdAt)}
          </p>
        </div>
        <div className="flex items-center">
          <CopyButton slug={link.slug} iconOnly />
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={showsQr}
            aria-label={`QR code for ${label}`}
            title="QR code"
            onClick={() => setShowsQr((shows) => !shows)}
          >
            <QrCodeIcon />
          </Button>
          <Button asChild variant="ghost" size="icon">
            <RouterLink to={`/links/${link.id}`} aria-label={`${label} analytics`} title="Analytics">
              <ChartLineIcon />
            </RouterLink>
          </Button>
          <DeleteLinkButton link={link} iconOnly />
        </div>
      </div>

      {showsQr && (
        <div className="flex animate-spring-in justify-center py-3 sm:col-span-full sm:justify-end">
          <QrCode slug={link.slug} />
        </div>
      )}
    </li>
  )
}

// Same box as LinkRow, so the page does not jump when the links arrive.
// The widths vary a little per row, like real slugs and URLs do.
const ACTION_COUNT = 4
const SKELETON_WIDTHS = [
  { slug: 'w-52', url: 'w-72' },
  { slug: 'w-44', url: 'w-56' },
  { slug: 'w-56', url: 'w-80' },
]

export function LinkRowSkeleton({ row }: { row: number }) {
  const widths = SKELETON_WIDTHS[row % SKELETON_WIDTHS.length]
  return (
    <li className={cn('grid gap-y-1.5 border-t border-border px-3 py-2.5 first:border-t-0', ROW_GRID)}>
      <div className="min-w-0">
        <Skeleton className={cn('h-5 max-w-full', widths.slug)} />
        <Skeleton className={cn('mt-1 h-4 max-w-full', widths.url)} />
      </div>
      <div className="flex items-center justify-between gap-3 sm:contents">
        <Skeleton className="h-4 w-8 sm:ml-auto" />
        <Skeleton className="hidden h-4 w-16 sm:block" />
        <div className="flex items-center gap-1">
          {Array.from({ length: ACTION_COUNT }, (_, action) => (
            <Skeleton key={action} className="size-11 rounded-md sm:size-9" />
          ))}
        </div>
      </div>
    </li>
  )
}
